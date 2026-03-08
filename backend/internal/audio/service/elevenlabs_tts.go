package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

type ElevenLabsTTS struct {
	apiURL string
	apiKey string
}

func NewElevenLabsTTS() (*ElevenLabsTTS, error) {
	apiKey := os.Getenv("ELEVEN_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("ELEVEN_API_KEY environment variable is required")
	}

	// Rachel voice ID: 21m00Tcm4TlvDq8ikWAM (or any other configured)
	voiceID := os.Getenv("ELEVEN_VOICE_ID")
	if voiceID == "" {
		voiceID = "21m00Tcm4TlvDq8ikWAM"
	}

	return &ElevenLabsTTS{
		apiURL: fmt.Sprintf("https://api.elevenlabs.io/v1/text-to-speech/%s/stream", voiceID),
		apiKey: apiKey,
	}, nil
}

// Em um ambiente de produção hardcore HTTP Streaming, você enviaria blocos pro mesmo socket TCP,
// mas para simplicidade em TTS, cada frase isolada do LLM é tipicamente submetida a uma call POST Single-Shot,
// recebendo o body em Stream. O TextToSpeechProvider Interface suporta chunking assíncrono.
func (t *ElevenLabsTTS) Start(ctx context.Context) (<-chan []byte, error) {
	// Not utilized heavily for HTTP unary calls, we just provide the standard interface.
	panic("Use StreamText directly for ElevenLabs TTS")
}

// StreamText faz um request POST para ElevenLabs e envia os bytes recebidos continuamente pelo canal out.
func (t *ElevenLabsTTS) StreamText(ctx context.Context, text string, out chan<- []byte) error {
	payload := map[string]interface{}{
		"text":     text,
		"model_id": "eleven_multilingual_v2",
		"voice_settings": map[string]interface{}{
			"stability":        0.5,
			"similarity_boost": 0.5,
		},
		"output_format": "mp3_44100_128",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, t.apiURL, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	req.Header.Set("xi-api-key", t.apiKey)
	req.Header.Set("Content-Type", "application/json")
	// Pedimos explicitly mp3 em baixa latência caso suportado
	req.Header.Set("Accept", "audio/mpeg")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("falha ao conectar na ElevenLabs TTS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyErr, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("erro da ElevenLabs TTS (status %d): %s", resp.StatusCode, bodyErr)
	}

	// Ler a resposta em chunks de 4KB (ideal para streaming WebSocket)
	buffer := make([]byte, 4096)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			n, err := resp.Body.Read(buffer)
			if n > 0 {
				// Cópia necessária pois o buffer é reutilizado
				chunk := make([]byte, n)
				copy(chunk, buffer[:n])
				out <- chunk
			}

			if err == io.EOF {
				return nil
			}
			if err != nil {
				log.Printf("[TTS] Erro de leitura de stream: %v", err)
				return err
			}
		}
	}
}

func (t *ElevenLabsTTS) SendText(text string) error {
	panic("Use StreamText directly")
}
func (t *ElevenLabsTTS) Close() error { return nil }
