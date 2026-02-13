package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"google.golang.org/genai"
)

// ChainRequest é o request para continuar uma frase co-op
type ChainRequest struct {
	SentenceSoFar string `json:"sentence_so_far"`
}

// ChainResponse é a resposta da IA com a próxima palavra
type ChainResponse struct {
	NextWord string `json:"nextword"`
}

// ChainNextWord gera a próxima palavra para continuar uma frase cooperativamente
func (s *Service) ChainNextWord(ctx context.Context, req ChainRequest) (*ChainResponse, error) {
	log.Printf("[AI/Chain] Generating next word for: %q", req.SentenceSoFar)

	prompt := fmt.Sprintf(`You are a cooperative sentence builder AI. You are alternating words with a human to build a grammatically correct and meaningful English sentence.

The sentence so far is: "%s"

Rules:
- Respond with ONLY a single JSON object: {"nextword": "<your_word>"}
- Add exactly ONE word that logically and grammatically continues the sentence
- The word should make grammatical sense in context
- Keep the sentence coherent and heading toward a natural conclusion
- Do NOT repeat the same word consecutively
- Do NOT add punctuation as a separate word; attach it to the word if needed (e.g. "happy." to end a sentence)
- If the sentence feels complete (8+ words), you may add a final word with a period to end it
- Do NOT include any explanation, markdown, or extra text
- Respond ONLY with the JSON object

Respond now:`, req.SentenceSoFar)

	result, err := s.client.Models.GenerateContent(
		ctx,
		ModelName,
		genai.Text(prompt),
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate chain word: %w", err)
	}

	text := result.Text()
	log.Printf("[AI/Chain] Raw response: %s", text)

	cleanJSON := sanitizeJSONResponse(text)

	var response ChainResponse
	if err := json.Unmarshal([]byte(cleanJSON), &response); err != nil {
		return nil, fmt.Errorf("failed to parse chain response: %w, raw: %s", err, text)
	}

	log.Printf("[AI/Chain] Next word: %q", response.NextWord)
	return &response, nil
}
