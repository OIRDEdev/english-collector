package routing

import (
	"extension-backend/internal/sse"
)

// SSEAdapter adapta sse.Service para routing.Broadcaster
type SSEAdapter struct {
	service *sse.Service
}

// NewSSEAdapter cria adapter para o SSE Service
func NewSSEAdapter(service *sse.Service) *SSEAdapter {
	if service == nil {
		return nil
	}
	return &SSEAdapter{service: service}
}

// SendTranslation envia evento de tradução para o usuário específico
func (a *SSEAdapter) SendTranslation(event TranslationEvent) {
	a.service.SendTranslation(
		event.UserID,
		event.PhraseID,
		event.Translation,
		event.Explanation,
		event.Slices,
		event.Model,
	)
}

// SendError envia evento de erro para o usuário específico
func (a *SSEAdapter) SendError(event ErrorEvent) {
	a.service.SendError(event.UserID, event.PhraseID, event.Error)
}
