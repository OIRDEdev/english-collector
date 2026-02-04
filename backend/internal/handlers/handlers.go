package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// Handler holds all HTTP handlers and their dependencies
type Handler struct {
	// Add service dependencies here
}

func NewHandler() *Handler {
	return &Handler{}
}


func (h *Handler) RegisterRoutes(r chi.Router) {
	
	r.Get("/health", h.HealthCheck)

	
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/", h.Welcome)

		
		r.Route("/phrases", func(r chi.Router) {
			r.Get("/", h.ListPhrases)
			r.Post("/", h.CreatePhrase)
			r.Get("/{id}", h.GetPhrase)
			r.Put("/{id}", h.UpdatePhrase)
			r.Delete("/{id}", h.DeletePhrase)
		})

		
		r.Route("/users", func(r chi.Router) {
			r.Get("/", h.ListUsers)
			r.Post("/", h.CreateUser)
			r.Get("/{id}", h.GetUser)
			r.Put("/{id}", h.UpdateUser)
			r.Delete("/{id}", h.DeleteUser)
		})
	})
}


func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	SendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Service is healthy",
	})
}


func (h *Handler) Welcome(w http.ResponseWriter, r *http.Request) {
	SendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Welcome to the Extension Backend API",
		Data: map[string]string{
			"version": "1.0.0",
		},
	})
}


func (h *Handler) ListPhrases(w http.ResponseWriter, r *http.Request) {
	SendJSON(w, http.StatusOK, Response{Success: true, Message: "List phrases"})
}

func (h *Handler) CreatePhrase(w http.ResponseWriter, r *http.Request) {
	SendJSON(w, http.StatusCreated, Response{Success: true, Message: "Phrase created"})
}

func (h *Handler) GetPhrase(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	SendJSON(w, http.StatusOK, Response{Success: true, Message: "Get phrase", Data: map[string]string{"id": id}})
}

func (h *Handler) UpdatePhrase(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	SendJSON(w, http.StatusOK, Response{Success: true, Message: "Phrase updated", Data: map[string]string{"id": id}})
}

func (h *Handler) DeletePhrase(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	SendJSON(w, http.StatusOK, Response{Success: true, Message: "Phrase deleted", Data: map[string]string{"id": id}})
}

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	SendJSON(w, http.StatusOK, Response{Success: true, Message: "List users"})
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	SendJSON(w, http.StatusCreated, Response{Success: true, Message: "User created"})
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	SendJSON(w, http.StatusOK, Response{Success: true, Message: "Get user", Data: map[string]string{"id": id}})
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	SendJSON(w, http.StatusOK, Response{Success: true, Message: "User updated", Data: map[string]string{"id": id}})
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	SendJSON(w, http.StatusOK, Response{Success: true, Message: "User deleted", Data: map[string]string{"id": id}})
}

func SendJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func SendError(w http.ResponseWriter, statusCode int, message string) {
	SendJSON(w, statusCode, Response{
		Success: false,
		Message: message,
	})
}
