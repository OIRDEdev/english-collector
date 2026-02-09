package repository

import (
	"context"

	"extension-backend/internal/phrase"
)

// PhraseAdapter adapta phrase.ServiceInterface para repository.Repository
type PhraseAdapter struct {
	service phrase.ServiceInterface
}

// NewPhraseAdapter cria adapter para o serviço de frases
func NewPhraseAdapter(service phrase.ServiceInterface) *PhraseAdapter {
	return &PhraseAdapter{service: service}
}

// Save implementa repository.Repository salvando via phrase service
func (a *PhraseAdapter) Save(ctx context.Context, details TranslationDetails) error {
	_, err := a.service.AddDetails(ctx, phrase.CreateDetailsInput{
		FraseID:          details.PhraseID,
		TraducaoCompleta: details.TraducaoCompleta,
		Explicacao:       details.Explicacao,
		FatiasTraducoes:  details.FatiasTraducoes,
		ModeloIA:         details.ModeloIA,
	})
	return err
}
