package service

import (
	"context"
	"fmt"
	"log"

	"extension-backend/internal/ai"
	"extension-backend/internal/audio"

	"google.golang.org/genai"
)

// GeminiLLM implements the audio.LLMProvider interface
type GeminiLLM struct {
	client *genai.Client
}

func NewGeminiLLM() (*GeminiLLM, error) {
	// Reutilizar configs baseadas no internal/ai existente
	baseSvc, err := ai.NewService()
	if err != nil {
		return nil, fmt.Errorf("failed to mount base AI for audio gen: %w", err)
	}

	// Como a variável "client" no internal/ai é não exportada, para audio real time
	// podemos criar uma nova instância direta aqui usando a mesma key ou exportar lá.
	// Vamos criar uma dedicada ao Audio para suportar Streaming Output (GenerateContentStream)
	
	importClient, err := ai.NewService() // Just to fetch validation safely if we don't access client directly.
	_ = importClient
	return &GeminiLLM{client: baseSvc.GetClient()}, nil
}

// GenerateStream wraps Gemini-2.0-flash using GenerateContentStream ensuring textual chunks
// are piped incrementally to the TTS Engine (or WebSocket UI) for max speed.
func (g *GeminiLLM) GenerateStream(ctx context.Context, history []audio.ConversationTurn, input string, out chan<- string) error {
	systemPrompt := `Você é um tutor de aprendizado de idiomas em uma conversa de voz fluida e rápida.
Regras:
- Seja extremamente conciso. Responda em no máximo 1 a 2 sentenças curtas.
- Fale naturalmente, sem usar formatação markdown (*, _, #) pois o texto vai direto para uma engine Text-To-Speech (TTS).
- Foque na conversação prática. Responda de forma engajadora, não robótica.`

	var contents []*genai.Content
	
	contents = append(contents, &genai.Content{
		Role:  "user",
		Parts: []*genai.Part{{Text: systemPrompt}},
	})

	contents = append(contents, &genai.Content{
		Role:  "model",
		Parts: []*genai.Part{{Text: "Entendido. Serei direto e conciso, auxiliando na fluência."}},
	})

	for _, turn := range history {
		// Map 'model' and 'user' correctly inside genai.Content
		contents = append(contents, &genai.Content{
			Role:  turn.Role,
			Parts: []*genai.Part{{Text: turn.Content}},
		})
	}

	contents = append(contents, &genai.Content{
		Role:  "user",
		Parts: []*genai.Part{{Text: input}},
	})

	iter := g.client.Models.GenerateContentStream(ctx, ai.ModelName, contents, nil)

	for resp, err := range iter {
		if err != nil {
			log.Printf("[LLM] Stream iteration error: %v", err)
			return err
		}

		for _, cand := range resp.Candidates {
			if cand.Content != nil {
				for _, part := range cand.Content.Parts {
					if part != nil && part.Text != "" {
						out <- part.Text // Flush string to TTS logic
					}
				}
			}
		}
	}

	return nil
}
