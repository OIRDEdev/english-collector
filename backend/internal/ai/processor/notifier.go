package processor

import (
	"log"

	"extension-backend/internal/ai/routing"
)

// Notifier envia notificações de eventos
type Notifier struct {
	broadcaster routing.Broadcaster
}

// NewNotifier cria um novo notifier
func NewNotifier(broadcaster routing.Broadcaster) *Notifier {
	if broadcaster == nil {
		return nil
	}
	return &Notifier{broadcaster: broadcaster}
}

// NotifySuccess envia notificação de tradução completa
func (n *Notifier) NotifySuccess(result Result) {
	if n == nil || n.broadcaster == nil {
		return
	}

	log.Printf("[AI] Broadcasting translation for phrase %d", result.PhraseID)

	n.broadcaster.SendTranslation(routing.TranslationEvent{
		PhraseID:    result.PhraseID,
		Translation: result.TraducaoCompleta,
		Explanation: result.Explicacao,
		Slices:      result.FatiasTraducoes,
		Model:       result.ModeloIA,
	})
}

// NotifyError envia notificação de erro
func (n *Notifier) NotifyError(phraseID int, err error) {
	if n == nil || n.broadcaster == nil {
		return
	}

	log.Printf("[AI] Broadcasting error for phrase %d: %v", phraseID, err)

	n.broadcaster.SendError(routing.ErrorEvent{
		PhraseID: phraseID,
		Error:    err.Error(),
	})
}
