package sse

import (
	"log"

	"extension-backend/internal/sse/repository"
)

// Service gerencia a lógica de envio de eventos SSE
type Service struct {
	repo *repository.Repository
}

// NewService cria um novo Service
func NewService(repo *repository.Repository) *Service {
	return &Service{repo: repo}
}

// SendToUser envia um evento para todos os clientes de um usuário específico
func (s *Service) SendToUser(userID int, event repository.Event) {
	clients := s.repo.GetByUserID(userID)
	if len(clients) == 0 {
		log.Printf("[SSE] No active clients for user %d, skipping event %s", userID, event.Type)
		return
	}

	for _, client := range clients {
		select {
		case client.Channel <- event:
		default:
			log.Printf("[SSE] Channel full for client %s (user %d), skipping", client.ID, userID)
		}
	}

	log.Printf("[SSE] Sent event '%s' to %d client(s) of user %d", event.Type, len(clients), userID)
}

// SendTranslation envia tradução para um usuário específico
func (s *Service) SendTranslation(userID, phraseID int, traducao, explicacao string, fatias map[string]string, modelo string) {
	if !s.repo.HasClients() {
		log.Printf("[SSE] No active clients, skipping translation for phrase %d", phraseID)
		return
	}

	s.SendToUser(userID, repository.Event{
		Type: "translation",
		Payload: repository.TranslationPayload{
			PhraseID:         phraseID,
			TraducaoCompleta: traducao,
			Explicacao:       explicacao,
			FatiasTraducoes:  fatias,
			ModeloIA:         modelo,
		},
	})
}

// SendError envia erro para um usuário específico
func (s *Service) SendError(userID, phraseID int, errMsg string) {
	s.SendToUser(userID, repository.Event{
		Type: "translation_error",
		Payload: map[string]interface{}{
			"phrase_id": phraseID,
			"error":     errMsg,
		},
	})
}

// BroadcastAll envia evento para todos os clientes (usado apenas para ping)
func (s *Service) BroadcastAll(event repository.Event) {
	clients := s.repo.GetAll()
	for _, client := range clients {
		select {
		case client.Channel <- event:
		default:
		}
	}
}
