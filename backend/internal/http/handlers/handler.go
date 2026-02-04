package handlers

import (
	"net/http"

	"extension-backend/internal/group"
	"extension-backend/internal/phrase"
	"extension-backend/internal/user"
)

type Handler struct {
	userService   user.ServiceInterface
	phraseService phrase.ServiceInterface
	groupService  group.ServiceInterface
	tokenService  *user.TokenService
}

func NewHandler(
	userService user.ServiceInterface,
	phraseService phrase.ServiceInterface,
	groupService group.ServiceInterface,
	tokenService *user.TokenService,
) *Handler {
	return &Handler{
		userService:   userService,
		phraseService: phraseService,
		groupService:  groupService,
		tokenService:  tokenService,
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
