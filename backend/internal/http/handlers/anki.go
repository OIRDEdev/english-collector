package handlers

import (
	"extension-backend/internal/anki"
	"net/http"
	"strconv"
)

// GetDueCards retorna os flashcards que precisam ser revisados agora
func (h *Handler) GetDueCards(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		SendError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	cards, err := h.ankiService.GetDueCards(ctx, userID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Due cards retrieved", cards)
}

// SubmitReview processa a resposta do usuário a um flashcard
func (h *Handler) SubmitReview(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input anki.ReviewInput
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Por enquanto, user_id via query param
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		SendError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	result, err := h.ankiService.SubmitReview(ctx, userID, input)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Review submitted", result)
}

// GetAnkiStats retorna as estatísticas do Anki para o usuário
func (h *Handler) GetAnkiStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		SendError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	stats, err := h.ankiService.GetStats(ctx, userID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Stats retrieved", stats)
}
