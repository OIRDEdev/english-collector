package repository

import (
	"fmt"
	"sync"
)

// Repository gerencia os clientes SSE em memória
type Repository struct {
	clients map[string]*Client
	mu      sync.RWMutex
}

// New cria um novo Repository
func New() *Repository {
	return &Repository{
		clients: make(map[string]*Client),
	}
}

// Add registra um novo cliente
func (r *Repository) Add(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.clients[client.ID] = client
}

// Remove remove um cliente e fecha o canal
func (r *Repository) Remove(clientID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if c, ok := r.clients[clientID]; ok {
		close(c.Channel)
		delete(r.clients, clientID)
	}
}

// GetByUserID retorna todos os clientes de um usuário específico
func (r *Repository) GetByUserID(userID int) []*Client {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*Client
	for _, c := range r.clients {
		if c.UserID == userID {
			result = append(result, c)
		}
	}
	return result
}

// GetAll retorna todos os clientes conectados
func (r *Repository) GetAll() []*Client {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*Client, 0, len(r.clients))
	for _, c := range r.clients {
		result = append(result, c)
	}
	return result
}

// Count retorna o número total de clientes
func (r *Repository) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.clients)
}

// HasClients verifica se há clientes ativos
func (r *Repository) HasClients() bool {
	return r.Count() > 0
}

// GenerateClientID gera um ID único para o cliente
func GenerateClientID(userID int, requestPtr string) string {
	return fmt.Sprintf("user-%d-%s", userID, requestPtr)
}
