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

// HandleWSConnection assumes an upgraded connection. It is blocking and runs until ctx ends
// or WebSocket disconnects.
func (p *Pipeline) HandleWSConnection(ctx context.Context, conn *websocket.Conn) {
	defer conn.Close()

	// Canais internos da orquestração
	llmOutputChan := make(chan string, 10)
	ttsOutputChan := make(chan []byte, 50)

	// Contexto cancelável interno para amarrar as go routines soltas
	pipelineCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Variáveis de escopo da conexão para rastrear dono da conversa e voz
	userID := 0 // We'll extract this from a config setup frame
	_ = userID  // Reserved for explicit setting

	// Sessão STT ativa (nil quando não está gravando)
	var activeSession audio.STTSession
	var sessionMu sync.Mutex

	// Mutex para escritas no WebSocket do cliente (conn não é thread-safe)
	var connWriteMu sync.Mutex

	// Helper para escrever JSON no client WS de forma thread-safe
	writeJSON := func(msg audio.WebsocketMessage) {
		connWriteMu.Lock()
		defer connWriteMu.Unlock()
		conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
		_ = conn.WriteJSON(msg)
	}

	// Goroutine: Escutar respostas (pedacinhos ou completas) da IA → Alimentar o TTS Streaming
	go func() {
		var completeAIResponse string
		for {
			select {
			case <-pipelineCtx.Done():
				return
			case botText, ok := <-llmOutputChan:
				if !ok {
					return
				}
				
				if botText == "<STREAM_DONE>" {
					// Save final accumulated response to history
					if p.historyManager != nil && completeAIResponse != "" {
					    p.historyManager.AppendTurn(pipelineCtx, userID, "model", completeAIResponse)
					}

					// Enviar resposta completa ao TTS em uma única chamada
					if completeAIResponse != "" {
						log.Printf("[AudioPipeline] Enviando resposta completa ao TTS (%d chars)", len(completeAIResponse))
						err := p.ttsProvider.StreamText(pipelineCtx, completeAIResponse, ttsOutputChan)
						if err != nil {
							log.Printf("[AudioPipeline] TTS HTTP Error: %v", err)
						}
						// Sinalizar fim do áudio para o frontend montar o Blob e reproduzir
						writeJSON(audio.WebsocketMessage{Type: "tts_end"})
					}

					completeAIResponse = ""
					continue
				}

				completeAIResponse += botText

				// Emit semantic text progressively back to the UI chat bubble
				writeJSON(audio.WebsocketMessage{
					Type: "text",
					Text: botText,
				})
			}
		}
	}()

	// Goroutine: Escutar Stream de Bytes MP3/PCM do TTS e enviar para o Client WebSocket
	go func() {
		for {
			select {
			case <-pipelineCtx.Done():
				return
			case audioBytes, ok := <-ttsOutputChan:
				if !ok {
					return
				}
				
				b64Audio := base64.StdEncoding.EncodeToString(audioBytes)
				connWriteMu.Lock()
				conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
				err := conn.WriteJSON(audio.WebsocketMessage{
					Type:  "audio",
					Audio: b64Audio,
				})
				connWriteMu.Unlock()

				if err != nil {
					log.Printf("[AudioPipeline] Error writing TTS audio to client: %v", err)
					cancel()
					return
				}
			}
		}
	}()

	// Loop Principal: Escutar WebSocket do cliente
	for {
		select {
		case <-pipelineCtx.Done():
			return
		default:
			var msg audio.WebsocketMessage
			err := conn.ReadJSON(&msg)
			if err != nil {
				log.Printf("[AudioPipeline] WS Read err or Client Disconnect: %v", err)
				cancel()
				return
			}

			switch msg.Type {
			case "setup":
				log.Printf("[AudioPipeline] Connection Configured")
				userID = 1 // Hardcoded to 1 for MVP local

			case "audio":
				sessionMu.Lock()

				// Se não existe sessão ativa, criar uma nova (começo de um turno de fala)
				if activeSession == nil {
					log.Printf("[AudioPipeline] Novo turno de fala detectado. Criando sessão STT...")
					session, err := p.sttFactory.NewSession(pipelineCtx)
					if err != nil {
						log.Printf("[AudioPipeline] Falha ao criar sessão STT: %v", err)
						sessionMu.Unlock()
						continue
					}
					activeSession = session
					log.Printf("[AudioPipeline] Sessão STT pronta para receber áudio")
				}

				// Decodificar base64 e enviar para STT
				audioBytes, err := base64.StdEncoding.DecodeString(msg.Audio)
				if err != nil {
					log.Printf("[AudioPipeline] Erro decodificando base64: %v", err)
					sessionMu.Unlock()
					continue
				}

				if err := activeSession.SendAudio(audioBytes); err != nil {
					log.Printf("[AudioPipeline] Erro enviando áudio para STT: %v", err)
				}

				sessionMu.Unlock()

			case "audio_end":
				sessionMu.Lock()
				session := activeSession
				activeSession = nil // Liberar para o próximo turno
				sessionMu.Unlock()

				if session == nil {
					log.Printf("[AudioPipeline] audio_end recebido sem sessão ativa, ignorando")
					continue
				}

				log.Printf("[AudioPipeline] audio_end recebido. Commitando e aguardando transcrição...")

				// Processar commit + transcript + LLM/TTS em goroutine para não bloquear
				go func(s audio.STTSession) {
					defer s.Close()

					// 1. Commit (pedir transcrição final)
					if err := s.Commit(); err != nil {
						log.Printf("[AudioPipeline] Erro no commit STT: %v", err)
						return
					}

					// 2. Esperar transcrição
					transcript, err := s.WaitForTranscript()
					if err != nil {
						log.Printf("[AudioPipeline] Erro aguardando transcrição: %v", err)
						return
					}

					if transcript == "" {
						log.Printf("[AudioPipeline] Transcrição vazia, ignorando turno")
						return
					}

					log.Printf("[AudioPipeline] Transcrito recebido: %s", transcript)

					// 3. Enviar para o frontend o que foi reconhecido
					writeJSON(audio.WebsocketMessage{
						Type: "stt",
						Text: transcript,
					})

					// 4. Salvar transcrição do usuário no contexto histórico
					if p.historyManager != nil {
						p.historyManager.AppendTurn(pipelineCtx, userID, "user", transcript)
					}

					// 5. Enviar para o LLM
					if p.llmProvider != nil {
						var history []audio.ConversationTurn
						if p.historyManager != nil {
							h, err := p.historyManager.GetHistory(pipelineCtx, userID)
							if err == nil {
								history = h
							}
						}

						err := p.llmProvider.GenerateStream(pipelineCtx, history, transcript, llmOutputChan)
						if err != nil {
							log.Printf("[AudioPipeline] LLM Error: %v", err)
						} else {
							llmOutputChan <- "<STREAM_DONE>"
						}
					}
				}(session)
			}
		}
	}
}
