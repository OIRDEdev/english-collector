package handlers

import (
	"net/http"

	"extension-backend/internal/ai"
	"extension-backend/internal/anki"
	"extension-backend/internal/cache"
	"extension-backend/internal/exercises"
	"extension-backend/internal/group"
	"extension-backend/internal/phrase"
	"extension-backend/internal/user"
)

type Handler struct {
	userService     user.ServiceInterface
	phraseService   phrase.ServiceInterface
	groupService    group.ServiceInterface
	tokenService    *user.TokenService
	ankiService     anki.ServiceInterface
	exerciseService exercises.ServiceInterface
	aiService       *ai.Service
	cacheClient     *cache.Client
}

func NewHandler(
	userService user.ServiceInterface,
	phraseService phrase.ServiceInterface,
	groupService group.ServiceInterface,
	tokenService *user.TokenService,
	ankiService anki.ServiceInterface,
	exerciseService exercises.ServiceInterface,
	aiService *ai.Service,
	cacheClient *cache.Client,
) *Handler {
	return &Handler{
		userService:     userService,
		phraseService:   phraseService,
		groupService:    groupService,
		tokenService:    tokenService,
		ankiService:     ankiService,
		exerciseService: exerciseService,
		aiService:       aiService,
		cacheClient:     cacheClient,
	}
}

func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	SendSuccess(w, http.StatusOK, "Service is healthy", nil)
}

func (h *Handler) Welcome(w http.ResponseWriter, r *http.Request) {
	SendSuccess(w, http.StatusOK, "Welcome to Extension Backend API", map[string]string{
		"version": "1.0.0",
	})
}
