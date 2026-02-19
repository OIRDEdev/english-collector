package settings

import (
	"encoding/json"
	"net/http"
	"strconv"

	"extension-backend/internal/settings/repository"
)

// Handler gerencia os endpoints HTTP de configurações
type Handler struct {
	service *Service
}

// NewHandler cria uma nova instância do Handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// GetSettings retorna as configurações do usuário
// GET /api/v1/settings?user_id=1
func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "invalid user_id", http.StatusBadRequest)
		return
	}

	settings, err := h.service.GetSettings(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(settings)
}

// UpdateSettings atualiza as configurações (SettingsModal)
// PUT /api/v1/settings
func (h *Handler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var input repository.UpdateSettingsInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if input.UserID == 0 {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	settings, err := h.service.UpdateSettings(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(settings)
}

// CompleteOnboarding salva os dados de onboarding
// POST /api/v1/settings/onboarding
func (h *Handler) CompleteOnboarding(w http.ResponseWriter, r *http.Request) {
	var input repository.OnboardingInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if input.UserID == 0 {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	if input.NativeLang == "" || input.TargetLang == "" {
		http.Error(w, "native_lang and target_lang are required", http.StatusBadRequest)
		return
	}

	settings, err := h.service.CompleteOnboarding(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(settings)
}
