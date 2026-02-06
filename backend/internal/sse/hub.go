package sse

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type TranslationEvent struct {
	PhraseID         int               `json:"phrase_id"`
	TraducaoCompleta string            `json:"traducao_completa"`
	Explicacao       string            `json:"explicacao"`
	FatiasTraducoes  map[string]string `json:"fatias_traducoes"`
	ModeloIA         string            `json:"modelo_ia"`
}

type Client struct {
	ID      string
	Channel chan Event
}

type Hub struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan Event
	mu         sync.RWMutex
	pingTicker *time.Ticker
	stopPing   chan struct{}
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Event, 100),
		stopPing:   make(chan struct{}),
	}
}

func (h *Hub) Run() {
	go func() {
		for {
			select {
			case client := <-h.register:
				h.mu.Lock()
				h.clients[client.ID] = client
				h.mu.Unlock()
				log.Printf("[SSE] Client connected: %s (total: %d)", client.ID, len(h.clients))

			case client := <-h.unregister:
				h.mu.Lock()
				if _, ok := h.clients[client.ID]; ok {
					close(client.Channel)
					delete(h.clients, client.ID)
				}
				h.mu.Unlock()
				log.Printf("[SSE] Client disconnected: %s (total: %d)", client.ID, len(h.clients))

			case event := <-h.broadcast:
				h.mu.RLock()
				for _, client := range h.clients {
					select {
					case client.Channel <- event:
					default:
						// Channel full, skip
					}
				}
				h.mu.RUnlock()
				log.Printf("[SSE] Broadcast event: %s", event.Type)
			}
		}
	}()

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
	h.mu.RLock()
	clientCount := len(h.clients)
	h.mu.RUnlock()

	if clientCount == 0 {
		return
	}

	h.Broadcast(Event{
		Type: "ping",
		Payload: map[string]interface{}{
			"timestamp":    time.Now().Unix(),
			"client_count": clientCount,
		},
	})
}

func (h *Hub) HasActiveClients() bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients) > 0
}

func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

func (h *Hub) Stop() {
	close(h.stopPing)
}

func (h *Hub) Broadcast(event Event) {
	h.broadcast <- event
}

func (h *Hub) BroadcastTranslation(phraseID int, traducao, explicacao string, fatias map[string]string, modelo string) {
	
	if !h.HasActiveClients() {
		log.Printf("[SSE] No active clients, skipping translation broadcast for phrase %d", phraseID)
		return
	}

	h.Broadcast(Event{
		Type: "translation",
		Payload: TranslationEvent{
			PhraseID:         phraseID,
			TraducaoCompleta: traducao,
			Explicacao:       explicacao,
			FatiasTraducoes:  fatias,
			ModeloIA:         modelo,
		},
	})
}

// Handler HTTP para conexões SSE
func (h *Hub) Handler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// SSE headers
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		// Cria cliente
		var clientID string
		if reqId, ok := r.Context().Value("request_id").(string); ok && reqId != "" {
			clientID = fmt.Sprintf("client-%s", reqId)
		} else {
			clientID = fmt.Sprintf("client-%p", r)
		}

		client := &Client{
			ID:      clientID,
			Channel: make(chan Event, 10),
		}

		// Registra cliente
		h.register <- client

		// Cleanup ao desconectar
		defer func() {
			h.unregister <- client
		}()

		// Flush inicial
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "SSE not supported", http.StatusInternalServerError)
			return
		}

		// Envia evento de conexão
		fmt.Fprintf(w, "event: connected\ndata: {\"client_id\":\"%s\"}\n\n", clientID)
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
