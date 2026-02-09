package processor

import (
	"context"
	"log"

	"extension-backend/internal/ai/repository"
)

// Persister salva resultados de tradução no banco
type Persister struct {
	repo repository.Repository
}

// NewPersister cria um novo persister
func NewPersister(repo repository.Repository) *Persister {
	return &Persister{repo: repo}
}

// Save persiste o resultado da tradução
func (p *Persister) Save(ctx context.Context, result Result) error {
	if result.Error != nil {
		return result.Error
	}

	log.Printf("[AI] Saving translation for phrase %d", result.PhraseID)

	err := p.repo.Save(ctx, repository.TranslationDetails{
		PhraseID:         result.PhraseID,
		TraducaoCompleta: result.TraducaoCompleta,
		Explicacao:       result.Explicacao,
		FatiasTraducoes:  result.FatiasTraducoes,
		ModeloIA:         result.ModeloIA,
	})

	if err != nil {
		log.Printf("[AI] Failed to save translation for phrase %d: %v", result.PhraseID, err)
		return err
	}

	log.Printf("[AI] Translation saved for phrase %d", result.PhraseID)
	return nil
}
