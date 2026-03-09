package processor

import (
	"context"
	"encoding/base64"
	"log"
	"sync"
	"time"

	"extension-backend/internal/audio"

	"github.com/gorilla/websocket"
)

// Pipeline orchestrates the real-time voice conversation pipeline.
// It reads from a single persistent client WebSocket and manages
// per-turn STT sessions, LLM generation, and TTS streaming.
type Pipeline struct {
	sttFactory     audio.STTSessionFactory
	ttsProvider    audio.TextToSpeechProvider
	llmProvider    audio.LLMProvider
	historyManager *HistoryManager
}

func NewPipeline(sttFactory audio.STTSessionFactory, tts audio.TextToSpeechProvider, llm audio.LLMProvider, history *HistoryManager) *Pipeline {
	return &Pipeline{
		sttFactory:     sttFactory,
		ttsProvider:    tts,
		llmProvider:    llm,
		historyManager: history,
	}
}

// HandleWSConnection runs the pipeline for one client WebSocket connection.
// Blocks until context cancels or the client disconnects.
func (p *Pipeline) HandleWSConnection(ctx context.Context, conn *websocket.Conn) {
	defer conn.Close()

	pipelineCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	// ─── Connection-scoped state ─────────────────────────────────
	var (
		userID    int
		userIDMu  sync.RWMutex
		connMu    sync.Mutex    // Protects all writes to conn (not thread-safe)
		wg        sync.WaitGroup // Tracks in-flight turn goroutines

		activeSession audio.STTSession
		sessionMu     sync.Mutex
	)

	// writeJSON sends a JSON message to the client WS in a thread-safe manner.
	writeJSON := func(msg audio.WebsocketMessage) {
		connMu.Lock()
		defer connMu.Unlock()
		conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("[Pipeline] Erro escrevendo no WS: %v", err)
		}
	}

	// writeAudioChunk sends a base64-encoded audio chunk to the client.
	writeAudioChunk := func(audioBytes []byte) error {
		b64 := base64.StdEncoding.EncodeToString(audioBytes)
		connMu.Lock()
		defer connMu.Unlock()
		conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		return conn.WriteJSON(audio.WebsocketMessage{
			Type:  "audio",
			Audio: b64,
		})
	}

	// ─── processTurn runs the complete pipeline for one speech turn ──
	// This is a single goroutine that executes sequentially:
	// Commit → WaitForTranscript → LLM → TTS → tts_end
	processTurn := func(session audio.STTSession, uid int) {
		defer wg.Done()
		defer session.Close()

		// 1. Commit — request final transcription
		if err := session.Commit(); err != nil {
			log.Printf("[Pipeline] Erro no commit STT: %v", err)
			return
		}

		// 2. Wait for transcript (with 30s timeout derived from pipeline context)
		transcriptCtx, transcriptCancel := context.WithTimeout(pipelineCtx, 30*time.Second)
		defer transcriptCancel()

		transcript, err := session.WaitForTranscript(transcriptCtx)
		if err != nil {
			log.Printf("[Pipeline] Erro aguardando transcrição: %v", err)
			return
		}

		if transcript == "" {
			log.Printf("[Pipeline] Transcrição vazia, ignorando turno")
			return
		}

		log.Printf("[Pipeline] Transcrição recebida: %s", transcript)

		// 3. Notify frontend with recognized text
		writeJSON(audio.WebsocketMessage{Type: "stt", Text: transcript})

		// 4. Save user turn to conversation history
		if p.historyManager != nil {
			p.historyManager.AppendTurn(pipelineCtx, uid, "user", transcript)
		}

		// 5. Generate LLM response
		if p.llmProvider == nil {
			return
		}

		// Fetch conversation history for context
		var history []audio.ConversationTurn
		if p.historyManager != nil {
			if h, err := p.historyManager.GetHistory(pipelineCtx, uid); err == nil {
				history = h
			}
		}

		// Per-turn channel — no cross-turn contamination
		llmCh := make(chan string, 10)
		var completeResponse string

		// Stream LLM in a sub-goroutine so we can read from llmCh concurrently
		llmDone := make(chan error, 1)
		go func() {
			defer close(llmCh)
			llmDone <- p.llmProvider.GenerateStream(pipelineCtx, history, transcript, llmCh)
		}()

		// Read LLM chunks, stream text to frontend, accumulate full response
		for chunk := range llmCh {
			completeResponse += chunk
			writeJSON(audio.WebsocketMessage{Type: "text", Text: chunk})
		}

		// Check LLM error
		if err := <-llmDone; err != nil {
			log.Printf("[Pipeline] LLM Error: %v", err)
			return
		}

		// 6. Save model response to history
		if p.historyManager != nil && completeResponse != "" {
			p.historyManager.AppendTurn(pipelineCtx, uid, "model", completeResponse)
		}

		// 7. TTS — send complete response in a single call
		if completeResponse == "" {
			return
		}

		log.Printf("[Pipeline] Enviando ao TTS (%d chars)", len(completeResponse))

		// Per-turn TTS channel
		ttsCh := make(chan []byte, 50)
		ttsDone := make(chan error, 1)

		go func() {
			defer close(ttsCh)
			ttsDone <- p.ttsProvider.StreamText(pipelineCtx, completeResponse, ttsCh)
		}()

		// Stream TTS audio chunks to client
		for audioBytes := range ttsCh {
			if err := writeAudioChunk(audioBytes); err != nil {
				log.Printf("[Pipeline] Erro enviando áudio TTS ao cliente: %v", err)
				cancel()
				return
			}
		}

		if err := <-ttsDone; err != nil {
			log.Printf("[Pipeline] TTS Error: %v", err)
		}

		// 8. Signal frontend that audio for this turn is complete
		writeJSON(audio.WebsocketMessage{Type: "tts_end"})
	}

	// Wait for all turn goroutines before exiting
	defer wg.Wait()

	// ─── Main Read Loop ──────────────────────────────────────────
	for {
		select {
		case <-pipelineCtx.Done():
			return
		default:
			var msg audio.WebsocketMessage
			if err := conn.ReadJSON(&msg); err != nil {
				log.Printf("[Pipeline] WS Read err ou cliente desconectou: %v", err)
				cancel()
				return
			}

			switch msg.Type {
			case "setup":
				log.Println("[Pipeline] Conexão configurada")
				userIDMu.Lock()
				userID = 1 // Hardcoded for MVP
				userIDMu.Unlock()

			case "audio":
				sessionMu.Lock()

				// Lazy session creation on first audio chunk of a turn
				if activeSession == nil {
					log.Println("[Pipeline] Novo turno de fala — criando sessão STT...")
					session, err := p.sttFactory.NewSession(pipelineCtx)
					if err != nil {
						log.Printf("[Pipeline] Falha criando sessão STT: %v", err)
						sessionMu.Unlock()
						continue
					}
					activeSession = session
					log.Println("[Pipeline] Sessão STT pronta")
				}

				// Decode base64 PCM and forward to STT
				pcmBytes, err := base64.StdEncoding.DecodeString(msg.Audio)
				if err != nil {
					log.Printf("[Pipeline] Erro decodificando base64: %v", err)
					sessionMu.Unlock()
					continue
				}

				if err := activeSession.SendAudio(pcmBytes); err != nil {
					log.Printf("[Pipeline] Erro enviando áudio ao STT: %v", err)
				}

				sessionMu.Unlock()

			case "audio_end":
				sessionMu.Lock()
				session := activeSession
				activeSession = nil // Free for next turn
				sessionMu.Unlock()

				if session == nil {
					log.Println("[Pipeline] audio_end sem sessão ativa, ignorando")
					continue
				}

				log.Println("[Pipeline] audio_end — iniciando processamento do turno")

				// Copy userID under read lock to avoid race
				userIDMu.RLock()
				uid := userID
				userIDMu.RUnlock()

				wg.Add(1)
				go processTurn(session, uid)
			}
		}
	}
}
