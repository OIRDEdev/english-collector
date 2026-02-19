package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"extension-backend/internal/http/middleware"
	"extension-backend/internal/user"
)

type Handler struct {
	service     *Service
	userService user.ServiceInterface
}

func NewHandler(service *Service, userService user.ServiceInterface) *Handler {
	return &Handler{
		service:     service,
		userService: userService,
	}
}

// Cookie constants
const (
	AccessTokenCookie  = "access_token"
	RefreshTokenCookie = "refresh_token"
)

func (h *Handler) setCookies(w http.ResponseWriter, tokens *user.AuthTokens) {
	http.SetCookie(w, &http.Cookie{
		Name:     AccessTokenCookie,
		Value:    tokens.AccessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production (HTTPS)
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(1 * time.Hour),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     RefreshTokenCookie,
		Value:    tokens.RefreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})
}

func (h *Handler) clearCookies(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     AccessTokenCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshTokenCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}

// UserResponse is the safe user data returned in responses
type UserResponse struct {
	ID    int    `json:"id"`
	Nome  string `json:"nome"`
	Email string `json:"email"`
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var input user.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	tokens, err := h.service.Login(r.Context(), input.Email, input.Senha, r.RemoteAddr, r.UserAgent())
	if err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	h.setCookies(w, tokens)

	// Fetch user data to return in response
	u, err := h.userService.GetByEmail(r.Context(), input.Email)
	if err != nil {
		// Cookies are set, login succeeded — return minimal response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Login successful"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(UserResponse{
		ID:    u.ID,
		Nome:  u.Nome,
		Email: u.Email,
	})
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var input user.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	tokens, err := h.service.Register(r.Context(), input.Nome, input.Email, input.Senha, r.RemoteAddr, r.UserAgent())
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.setCookies(w, tokens)

	// Fetch user data to return
	u, err := h.userService.GetByEmail(r.Context(), input.Email)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Registration successful"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(UserResponse{
		ID:    u.ID,
		Nome:  u.Nome,
		Email: u.Email,
	})
}

func (h *Handler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Credential string `json:"credential"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	tokens, err := h.service.GoogleLogin(r.Context(), input.Credential, r.RemoteAddr, r.UserAgent())
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	h.setCookies(w, tokens)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Google login successful"})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	h.clearCookies(w)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out"})
}

func (h *Handler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(RefreshTokenCookie)
	if err != nil {
		http.Error(w, "missing refresh token", http.StatusUnauthorized)
		return
	}

	tokens, err := h.service.RefreshToken(r.Context(), cookie.Value, r.RemoteAddr, r.UserAgent())
	if err != nil {
		h.clearCookies(w)
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	h.setCookies(w, tokens)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Token refreshed"})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	u, err := h.userService.GetByID(r.Context(), fmt.Sprintf("%d", claims.UserID))
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(UserResponse{
		ID:    u.ID,
		Nome:  u.Nome,
		Email: u.Email,
	})
}