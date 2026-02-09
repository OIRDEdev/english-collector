package routing

import (
	"extension-backend/internal/sse"
)

// SSEAdapter adapta sse.Hub para routing.Broadcaster
type SSEAdapter struct {
	hub *sse.Hub
}

// NewSSEAdapter cria adapter para o hub SSE
func NewSSEAdapter(hub *sse.Hub) *SSEAdapter {
	if hub == nil {
		return nil
	}
	return &SSEAdapter{hub: hub}
}

// SendTranslation envia evento de tradução completa
func (a *SSEAdapter) SendTranslation(event TranslationEvent) {
	a.hub.BroadcastTranslation(
		event.PhraseID,
		event.Translation,
		event.Explanation,
		event.Slices,
		event.Model,
	)
}

// SendError envia evento de erro
func (a *SSEAdapter) SendError(event ErrorEvent) {
	a.hub.Broadcast(sse.Event{
		Type: "translation_error",
		Payload: map[string]interface{}{
			"phrase_id": event.PhraseID,
			"error":     event.Error,
		},
	})
}
