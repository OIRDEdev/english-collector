package http

import (
	"net/http"

	"extension-backend/internal/http/handlers"
	"extension-backend/internal/http/middleware"
	"extension-backend/internal/sse"

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

func RegisterRoutes(r chi.Router, h *handlers.Handler, aiMiddleware *middleware.AIMiddleware, sseHub *sse.Hub) {
	r.Get("/health", h.HealthCheck)

	// SSE endpoint para receber traduções em tempo real
	if sseHub != nil {
		r.Get("/api/v1/sse/translations", sseHub.Handler())
	}

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/", h.Welcome)

		r.Route("/phrases", func(r chi.Router) {
			r.Get("/", h.ListPhrases)
			r.Get("/{id}", h.GetPhrase)
			r.Delete("/{id}", h.DeletePhrase)

			if aiMiddleware != nil {
				r.With(aiMiddleware.ProcessTranslation).Post("/", h.CreatePhrase)
				r.With(aiMiddleware.ProcessTranslation).Put("/{id}", h.UpdatePhrase)
			} else {
				r.Post("/", h.CreatePhrase)
				r.Put("/{id}", h.UpdatePhrase)
			}
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

func wrapWithAI(aiMiddleware *middleware.AIMiddleware, handler http.HandlerFunc) http.HandlerFunc {
	if aiMiddleware == nil {
		return handler
	}
	return func(w http.ResponseWriter, r *http.Request) {
		aiMiddleware.ProcessTranslation(handler).ServeHTTP(w, r)
	}
}
