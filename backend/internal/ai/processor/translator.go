package processor

import (
	"context"
	"log"

	"extension-backend/internal/ai"
)

// Translator executa a tradução via IA
type Translator struct {
	service ai.TranslatorService
}

// NewTranslator cria um novo tradutor
func NewTranslator(service ai.TranslatorService) *Translator {
	return &Translator{service: service}
}

// Translate executa a tradução e retorna o resultado
func (t *Translator) Translate(ctx context.Context, req Request) Result {
	log.Printf("[AI] Translating phrase %d", req.PhraseID)

	response, err := t.service.Translate(ctx, ai.TranslationRequest{
		ID:            req.PhraseID,
		Conteudo:      req.Conteudo,
		IdiomaOrigem:  req.IdiomaOrigem,
		IdiomaDestino: req.IdiomaDestino,
		Contexto:      req.Contexto,
	})

	if err != nil {
		log.Printf("[AI] Translation failed for phrase %d: %v", req.PhraseID, err)
		return Result{PhraseID: req.PhraseID, Error: err}
	}

	log.Printf("[AI] Translation completed for phrase %d", req.PhraseID)
	return Result{
		PhraseID:         req.PhraseID,
		TraducaoCompleta: response.TraducaoCompleta,
		Explicacao:       response.Explicacao,
		FatiasTraducoes:  response.FatiasTraducoes,
		ModeloIA:         response.ModeloIA,
	}
}
