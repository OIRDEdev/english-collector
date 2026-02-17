package handlers

import (
	"net/http"

	"extension-backend/internal/user"
)

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input user.LoginInput
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ip := r.RemoteAddr
	userAgent := r.UserAgent()

	tokens, err := h.userService.Login(ctx, input, ip, userAgent)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	SendSuccess(w, http.StatusOK, "Login successful", tokens)
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input user.RegisterInput
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ip := r.RemoteAddr
	userAgent := r.UserAgent()

	tokens, err := h.userService.Register(ctx, input, ip, userAgent)
	if err != nil {
		SendError(w, http.StatusBadRequest, err.Error())
		return
	}

	SendSuccess(w, http.StatusCreated, "User registered", tokens)
}

func (h *Handler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ip := r.RemoteAddr
	userAgent := r.UserAgent()

	tokens, err := h.userService.RefreshTokens(ctx, input.RefreshToken, ip, userAgent)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}

	SendSuccess(w, http.StatusOK, "Token refreshed", tokens)
}
