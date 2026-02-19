package sse

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"extension-backend/internal/sse/repository"
)

// Hub gerencia conexões SSE e distribui eventos
type Hub struct {
	repo       *repository.Repository
	service    *Service
	pingTicker *time.Ticker
	stopPing   chan struct{}
}

// NewHub cria um novo Hub com repository e service
func NewHub() *Hub {
	repo := repository.New()
	service := NewService(repo)

	return &Hub{
		repo:     repo,
		service:  service,
		stopPing: make(chan struct{}),
	}
}

// GetService retorna o Service do Hub (usado pelos callers externos)
func (h *Hub) GetService() *Service {
	return h.service
}

// Run inicia o Hub (ping routine)
func (h *Hub) Run() {
	h.startPingRoutine()
}

func (h *Hub) startPingRoutine() {
	h.pingTicker = time.NewTicker(5 * time.Second)

	go func() {
		for {
			select {
			case <-h.pingTicker.C:
				h.sendPingIfHasClients()

			case <-h.stopPing:
				h.pingTicker.Stop()
				return
			}
		}
	}()
}

func (h *Hub) sendPingIfHasClients() {
	count := h.repo.Count()
	if count == 0 {
		return
	}

	h.service.BroadcastAll(repository.Event{
		Type: "ping",
		Payload: map[string]interface{}{
			"timestamp":    time.Now().Unix(),
			"client_count": count,
		},
	})
}

// HasActiveClients verifica se há clientes ativos
func (h *Hub) HasActiveClients() bool {
	return h.repo.HasClients()
}

// ClientCount retorna o número de clientes conectados
func (h *Hub) ClientCount() int {
	return h.repo.Count()
}

// Stop encerra o Hub
func (h *Hub) Stop() {
	close(h.stopPing)
}

// Handler retorna o http.HandlerFunc para conexões SSE
// Exige ?user_id=N no query string
func (h *Hub) Handler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// SSE headers
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		// Extrair user_id do query param
		userIDStr := r.URL.Query().Get("user_id")
		if userIDStr == "" {
			http.Error(w, "user_id is required", http.StatusBadRequest)
			return
		}

		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			http.Error(w, "invalid user_id", http.StatusBadRequest)
			return
		}

		// Gerar client ID único
		clientID := repository.GenerateClientID(userID, fmt.Sprintf("%p", r))

		client := &repository.Client{
			ID:      clientID,
			UserID:  userID,
			Channel: make(chan repository.Event, 10),
		}

		// Registrar cliente
		h.repo.Add(client)
		log.Printf("[SSE] Client connected: %s (user: %d, total: %d)", clientID, userID, h.repo.Count())

		// Cleanup ao desconectar
		defer func() {
			h.repo.Remove(client.ID)
			log.Printf("[SSE] Client disconnected: %s (user: %d, total: %d)", clientID, userID, h.repo.Count())
		}()

		// Flush inicial
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "SSE not supported", http.StatusInternalServerError)
			return
		}

		// Evento de conexão
		fmt.Fprintf(w, "event: connected\ndata: {\"client_id\":\"%s\",\"user_id\":%d}\n\n", clientID, userID)
		flusher.Flush()

		// Loop de eventos
		for {
			select {
			case <-r.Context().Done():
				return

			case event, ok := <-client.Channel:
				if !ok {
					return
				}

				data, err := json.Marshal(event)
				if err != nil {
					log.Printf("[SSE] Error marshaling event: %v", err)
					continue
				}

				fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event.Type, data)
				flusher.Flush()
			}
		}
	}
}
