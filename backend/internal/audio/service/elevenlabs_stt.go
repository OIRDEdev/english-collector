package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"extension-backend/internal/audio"

	"github.com/gorilla/websocket"
)

// ─── Factory ────────────────────────────────────────────────────

// ElevenLabsSTTFactory implements audio.STTSessionFactory.
// Holds credentials and creates fresh sessions per speech turn.
type ElevenLabsSTTFactory struct {
	apiURL string
	apiKey string
}

func NewElevenLabsSTTFactory() (*ElevenLabsSTTFactory, error) {
	apiKey := os.Getenv("ELEVEN_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("ELEVEN_API_KEY environment variable is required")
	}

	apiURL := "wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime"
	return &ElevenLabsSTTFactory{
		apiURL: apiURL,
		apiKey: apiKey,
	}, nil
}

// NewSession dials ElevenLabs, waits for `session_started`, and returns a ready session.
func (f *ElevenLabsSTTFactory) NewSession(ctx context.Context) (audio.STTSession, error) {
	headers := http.Header{}
	headers.Set("xi-api-key", f.apiKey)

	conn, _, err := websocket.DefaultDialer.Dial(f.apiURL, headers)
	if err != nil {
		return nil, fmt.Errorf("[STT] falha ao conectar na ElevenLabs STT: %w", err)
	}

	session := &ElevenLabsSTTSession{conn: conn}

	// Esperar pelo evento session_started antes de retornar
	if err := session.waitForSessionStarted(ctx); err != nil {
		conn.Close()
		return nil, fmt.Errorf("[STT] falha aguardando session_started: %w", err)
	}

	log.Println("[STT] Sessão criada e pronta para receber áudio")
	return session, nil
}

// ─── Session (per-turn) ─────────────────────────────────────────

// ElevenLabsSTTSession implements audio.STTSession.
// Represents a single speech turn WebSocket connection.
type ElevenLabsSTTSession struct {
	conn *websocket.Conn
}

// sttMessage represents any message from the ElevenLabs STT WebSocket
type sttMessage struct {
	MessageType string `json:"message_type"`
	Text        string `json:"text"`
	Error       string `json:"error"`
	SessionID   string `json:"session_id"`
}

// waitForSessionStarted blocks until the server sends `session_started`.
func (s *ElevenLabsSTTSession) waitForSessionStarted(ctx context.Context) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			_, msg, err := s.conn.ReadMessage()
			if err != nil {
				return fmt.Errorf("erro lendo handshake STT: %w", err)
			}

			var resp sttMessage
			if err := json.Unmarshal(msg, &resp); err != nil {
				log.Printf("[STT] Mensagem não-JSON no handshake: %s", string(msg))
				continue
			}

			if resp.Error != "" {
				return fmt.Errorf("erro do provedor durante handshake: %s", resp.Error)
			}

			if resp.MessageType == "session_started" {
				log.Printf("[STT] session_started recebido (session_id: %s)", resp.SessionID)
				return nil
			}

			log.Printf("[STT] Mensagem ignorada durante handshake: %s", resp.MessageType)
		}
	}
}

// SendAudio envia um chunk de áudio PCM como input_audio_chunk com commit=false.
func (s *ElevenLabsSTTSession) SendAudio(audioData []byte) error {
	if s.conn == nil {
		return fmt.Errorf("sessão STT não inicializada")
	}

	encoded := base64.StdEncoding.EncodeToString(audioData)

	payload := map[string]interface{}{
		"message_type":  "input_audio_chunk",
		"audio_base_64": encoded,
		"sample_rate":   16000,
		"commit":        false,
	}

	return s.conn.WriteJSON(payload)
}

// Commit envia o último chunk com commit=true para solicitar a transcrição final.
func (s *ElevenLabsSTTSession) Commit() error {
	if s.conn == nil {
		return fmt.Errorf("sessão STT não inicializada para commit")
	}

	payload := map[string]interface{}{
		"message_type":  "input_audio_chunk",
		"audio_base_64": "",
		"commit":        true,
	}

	log.Println("[STT] Commit enviado, aguardando transcrição final")
	return s.conn.WriteJSON(payload)
}

// WaitForTranscript bloqueia até receber `committed_transcript` e retorna o texto.
func (s *ElevenLabsSTTSession) WaitForTranscript() (string, error) {
	if s.conn == nil {
		return "", fmt.Errorf("sessão STT não inicializada")
	}

	for {
		_, msg, err := s.conn.ReadMessage()
		if err != nil {
			return "", fmt.Errorf("[STT] erro lendo transcrição: %w", err)
		}

		var resp sttMessage
		if err := json.Unmarshal(msg, &resp); err != nil {
			log.Printf("[STT] Payload JSON desconhecido: %s", string(msg))
			continue
		}

		if resp.Error != "" {
			return "", fmt.Errorf("[STT] erro do provedor: %s", resp.Error)
		}

		switch resp.MessageType {
		case "committed_transcript":
			log.Printf("[STT] Transcrição final recebida: %s", resp.Text)
			return resp.Text, nil
		case "partial_transcript":
			// Podemos logar parciais para debug, mas não retornamos ainda
			if resp.Text != "" {
				log.Printf("[STT] Parcial: %s", resp.Text)
			}
		default:
			log.Printf("[STT] Mensagem ignorada: %s", resp.MessageType)
		}
	}
}

// Close encerra a conexão WebSocket da sessão.
func (s *ElevenLabsSTTSession) Close() error {
	if s.conn != nil {
		return s.conn.Close()
	}
	return nil
}
