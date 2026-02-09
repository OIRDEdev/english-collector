package ai

import "context"

// ServiceInterface define as operações do serviço de IA
type ServiceInterface interface {
	Translate(ctx context.Context, req TranslationRequest) (*TranslationResponse, error)
}

// PhraseStorer interface para salvar detalhes de tradução (injetada externamente)
type PhraseStorer interface {
	SaveTranslationDetails(ctx context.Context, input TranslationDetailsInput) error
}

// EventBroadcaster interface para eventos em tempo real (injetada externamente)
type EventBroadcaster interface {
	BroadcastTranslation(phraseID int, translation, explanation string, slices map[string]string, model string)
	BroadcastError(phraseID int, err error)
}

// TranslationDetailsInput input para salvar detalhes
type TranslationDetailsInput struct {
	PhraseID         int
	TraducaoCompleta string
	Explicacao       string
	FatiasTraducoes  map[string]string
	ModeloIA         string
}
