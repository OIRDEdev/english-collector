package ai

import (
	"context"

	"extension-backend/internal/phrase"
)

// PhraseStorerAdapter adapta phrase.ServiceInterface para ai.PhraseStorer
type PhraseStorerAdapter struct {
	service phrase.ServiceInterface
}

// NewPhraseStorerAdapter cria adapter para o serviço de frases
func NewPhraseStorerAdapter(service phrase.ServiceInterface) *PhraseStorerAdapter {
	return &PhraseStorerAdapter{service: service}
}

// SaveTranslationDetails implementa ai.PhraseStorer
func (a *PhraseStorerAdapter) SaveTranslationDetails(ctx context.Context, input TranslationDetailsInput) error {
	_, err := a.service.AddDetails(ctx, phrase.CreateDetailsInput{
		FraseID:          input.PhraseID,
		TraducaoCompleta: input.TraducaoCompleta,
		Explicacao:       input.Explicacao,
		FatiasTraducoes:  input.FatiasTraducoes,
		ModeloIA:         input.ModeloIA,
	})
	return err
}
