package sse

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"extension-backend/internal/sse/repository"
	"extension-backend/internal/user"
)

// Hub gerencia conexões SSE e distribui eventos
type Hub struct {
	repo         *repository.Repository
	service      *Service
	tokenService *user.TokenService
	pingTicker   *time.Ticker
	stopPing     chan struct{}
}

// NewHub cria um novo Hub com repository e service
func NewHub(tokenService *user.TokenService) *Hub {
	repo := repository.New()
	service := NewService(repo)

	return &Hub{
		repo:         repo,
		service:      service,
		tokenService: tokenService,
		stopPing:     make(chan struct{}),
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

// extractUserID extracts user ID from cookie JWT or query param fallback
func (h *Hub) extractUserID(r *http.Request) (int, error) {
	// 1. Try cookie auth (browser/extension)
	if cookie, err := r.Cookie("access_token"); err == nil && cookie.Value != "" {
		if h.tokenService != nil {
			claims, err := h.tokenService.ValidateAccessToken(cookie.Value)
			if err == nil {
				return claims.UserID, nil
			}
			log.Printf("[SSE] Cookie JWT invalid: %v", err)
		}
	}

	// 2. Fallback to ?user_id=N (API/dev usage)
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr != "" {
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			return 0, fmt.Errorf("invalid user_id: %w", err)
		}
		return userID, nil
	}

	return 0, fmt.Errorf("authentication required: provide cookie or ?user_id=N")
}

// Handler retorna o http.HandlerFunc para conexões SSE
func (h *Hub) Handler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// SSE headers
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		// Extract UserID from cookie or query param
		userID, err := h.extractUserID(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
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
