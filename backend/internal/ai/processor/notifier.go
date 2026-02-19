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

// NotifySuccess envia notificação de tradução completa para o usuário correto
func (n *Notifier) NotifySuccess(result Result) {
	if n == nil || n.broadcaster == nil {
		return
	}

	log.Printf("[AI] Sending translation for phrase %d to user %d", result.PhraseID, result.UserID)

	n.broadcaster.SendTranslation(routing.TranslationEvent{
		UserID:      result.UserID,
		PhraseID:    result.PhraseID,
		Translation: result.TraducaoCompleta,
		Explanation: result.Explicacao,
		Slices:      result.FatiasTraducoes,
		Model:       result.ModeloIA,
	})
}

// NotifyError envia notificação de erro para o usuário correto
func (n *Notifier) NotifyError(userID, phraseID int, err error) {
	if n == nil || n.broadcaster == nil {
		return
	}

	log.Printf("[AI] Sending error for phrase %d to user %d: %v", phraseID, userID, err)

	n.broadcaster.SendError(routing.ErrorEvent{
		UserID:   userID,
		PhraseID: phraseID,
		Error:    err.Error(),
	})
}
