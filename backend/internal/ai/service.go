package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"

	"google.golang.org/genai"
)

const (
	ModelName = "gemini-2.0-flash"
)

type Service struct {
	client *genai.Client
}

func NewService() (*Service, error) {
	apiKey := os.Getenv("API_KEY_GEMINI")
	if apiKey == "" {
		return nil, fmt.Errorf("API_KEY_GEMINI environment variable is required")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create genai client: %w", err)
	}

	return &Service{client: client}, nil
}

func (s *Service) Translate(ctx context.Context, req TranslationRequest) (*TranslationResponse, error) {
	log.Printf("[AI] Starting translation for phrase %d: %s", req.ID, req.Conteudo[:min(50, len(req.Conteudo))])
	
	prompt := s.buildPrompt(req)

	result, err := s.client.Models.GenerateContent(
		ctx,
		ModelName,
		genai.Text(prompt),
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	text := result.Text()
	log.Printf("[AI] Raw response (first 200 chars): %s", text[:min(200, len(text))])
	
	cleanJSON := sanitizeJSONResponse(text)
	log.Printf("[AI] Sanitized JSON (first 200 chars): %s", cleanJSON[:min(200, len(cleanJSON))])

	var response TranslationResponse
	if err := json.Unmarshal([]byte(cleanJSON), &response); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w, raw: %s", err, text)
	}

	log.Printf("[AI] Translation parsed successfully for phrase %d", req.ID)
	response.ModeloIA = ModelName
	return &response, nil
}

// sanitizeJSONResponse removes markdown formatting from AI response
func sanitizeJSONResponse(text string) string {
	// Remove ```json and ``` markdown blocks
	re := regexp.MustCompile("(?s)```(?:json)?\\s*(.*?)```")
	matches := re.FindStringSubmatch(text)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}

	// Try to extract JSON object directly
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start != -1 && end != -1 && end > start {
		return text[start : end+1]
	}

	return strings.TrimSpace(text)
}

func (s *Service) buildPrompt(req TranslationRequest) string {
	fmt.Printf("Building prompt for phrase %d: %s", req.ID, req.Contexto)
	contextSection := ""
	if req.Contexto != "" {
		contextSection = fmt.Sprintf(`
Contexto adicional (use para melhor tradução):
%s
`, req.Contexto)
	}

	return fmt.Sprintf(`Você é uma API.  
Responda **APENAS** com um JSON válido, sem texto adicional, sem comentários, sem markdown.

Formato obrigatório da resposta:
%s

Regras obrigatórias:
- NÃO escreva explicações fora do JSON
- NÃO use `+"`"+`json`+"`"+` ou qualquer bloco de código
- NÃO inclua texto antes ou depois do JSON
- Todos os campos devem ser preenchidos
- O conteúdo deve ser traduzido de %s para %s
- Use o contexto fornecido para entender melhor a frase
%s
Dados de entrada:
ID: %d
Conteúdo: "%s"

Par de idiomas:
%s-%s`,
		ResponseFormat,
		req.IdiomaOrigem,
		req.IdiomaDestino,
		contextSection,
		req.ID,
		req.Conteudo,
		req.IdiomaOrigem,
		req.IdiomaDestino,
	)
}
