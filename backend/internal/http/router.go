package http

import (
	"extension-backend/internal/http/handlers"
	"extension-backend/internal/http/middleware"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

func NewRouter() chi.Router {
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.CORS)

	return r
}

func RegisterRoutes(r chi.Router, h *handlers.Handler) {
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

		r.Route("/auth", func(r chi.Router) {
			r.Post("/login", h.Login)
			r.Post("/register", h.Register)
			r.Post("/refresh", h.RefreshToken)
		})

		r.Route("/groups", func(r chi.Router) {
			r.Get("/", h.ListGroups)
			r.Post("/", h.CreateGroup)
			r.Get("/{id}", h.GetGroup)
			r.Put("/{id}", h.UpdateGroup)
			r.Delete("/{id}", h.DeleteGroup)
		})
	})
}
