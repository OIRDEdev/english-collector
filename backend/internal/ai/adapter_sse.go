package ai

import (
	"extension-backend/internal/sse"
)

// SSEBroadcasterAdapter adapta sse.Hub para ai.EventBroadcaster
type SSEBroadcasterAdapter struct {
	hub *sse.Hub
}

// NewSSEBroadcasterAdapter cria adapter para o hub SSE
func NewSSEBroadcasterAdapter(hub *sse.Hub) *SSEBroadcasterAdapter {
	if hub == nil {
		return nil
	}
	return &SSEBroadcasterAdapter{hub: hub}
}

// BroadcastTranslation implementa ai.EventBroadcaster
func (a *SSEBroadcasterAdapter) BroadcastTranslation(phraseID int, translation, explanation string, slices map[string]string, model string) {
	a.hub.BroadcastTranslation(phraseID, translation, explanation, slices, model)
}

// BroadcastError implementa ai.EventBroadcaster
func (a *SSEBroadcasterAdapter) BroadcastError(phraseID int, err error) {
	a.hub.Broadcast(sse.Event{
		Type: "translation_error",
		Payload: map[string]interface{}{
			"phrase_id": phraseID,
			"error":     err.Error(),
		},
	})
}
