package http

import (
	"extension-backend/internal/auth"
	"extension-backend/internal/cache"
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

func RegisterRoutes(r chi.Router, h *handlers.Handler, authHandler *auth.Handler, aiMiddleware *middleware.AIMiddleware, sseHub *sse.Hub, cacheClient *cache.Client) {
	r.Get("/health", h.HealthCheck)

	// SSE endpoint para receber traduções em tempo real
	if sseHub != nil {
		r.Get("/api/v1/sse/translations", sseHub.Handler())
	}

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/", h.Welcome)

		r.Route("/phrases", func(r chi.Router) {
			// GET routes com cache
			if cacheClient != nil {
				r.With(cacheClient.Middleware("phrases", cache.DefaultTTL)).Get("/", h.ListPhrases)
				r.With(cacheClient.Middleware("phrases", cache.DefaultTTL)).Get("/{id}", h.GetPhrase)
			} else {
				r.Get("/", h.ListPhrases)
				r.Get("/{id}", h.GetPhrase)
			}

			r.Delete("/{id}", h.DeletePhrase)

			// Mutações com invalidação de cache
			if aiMiddleware != nil {
				if cacheClient != nil {
					r.With(cacheClient.InvalidateOn("cache:phrases:*"), aiMiddleware.ProcessTranslation).Post("/", h.CreatePhrase)
					r.With(cacheClient.InvalidateOn("cache:phrases:*"), aiMiddleware.ProcessTranslation).Put("/{id}", h.UpdatePhrase)
				} else {
					r.With(aiMiddleware.ProcessTranslation).Post("/", h.CreatePhrase)
					r.With(aiMiddleware.ProcessTranslation).Put("/{id}", h.UpdatePhrase)
				}
			} else {
				if cacheClient != nil {
					r.With(cacheClient.InvalidateOn("cache:phrases:*")).Post("/", h.CreatePhrase)
					r.With(cacheClient.InvalidateOn("cache:phrases:*")).Put("/{id}", h.UpdatePhrase)
				} else {
					r.Post("/", h.CreatePhrase)
					r.Put("/{id}", h.UpdatePhrase)
				}
			}
		})

		r.Route("/users", func(r chi.Router) {
			if cacheClient != nil {
				r.With(cacheClient.Middleware("users", cache.DefaultTTL)).Get("/", h.ListUsers)
			} else {
				r.Get("/", h.ListUsers)
			}
			r.Post("/", h.CreateUser)
			r.Get("/{id}", h.GetUser)
			r.Put("/{id}", h.UpdateUser)
			r.Delete("/{id}", h.DeleteUser)
		})

		r.Route("/auth", func(r chi.Router) {
			r.Post("/login", authHandler.Login)
			r.Post("/register", authHandler.Register)
			r.Post("/google", authHandler.GoogleLogin) // New
			r.Post("/refresh", authHandler.RefreshToken)
			r.Post("/logout", authHandler.Logout) // New
            r.Get("/me", authHandler.Me) // New
		})

		r.Route("/groups", func(r chi.Router) {
			if cacheClient != nil {
				r.With(cacheClient.Middleware("groups", cache.DefaultTTL)).Get("/", h.ListGroups)
			} else {
				r.Get("/", h.ListGroups)
			}
			r.Post("/", h.CreateGroup)
			r.Get("/{id}", h.GetGroup)
			r.Put("/{id}", h.UpdateGroup)
			r.Delete("/{id}", h.DeleteGroup)
		})

		r.Route("/anki", func(r chi.Router) {
			r.Get("/due", h.GetDueCards)
			r.Post("/review", h.SubmitReview)
			r.Get("/stats", h.GetAnkiStats)
		})

		r.Route("/exercises", func(r chi.Router) {
			r.Get("/", h.ListExercises)
			r.Get("/catalogo/{catalogoId}", h.GetExercisesByCatalogo)
			r.Get("/{id}", h.GetExercise)
			r.Post("/chain/next-word", h.ChainNextWord)
		})
	})
}
