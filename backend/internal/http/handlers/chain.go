package handlers

import (
	"encoding/json"
	"net/http"

	"extension-backend/internal/ai"
)

// TODO: CRIAR LIMITE DE CHAMADAS POR USUARIO DE 10
// ChainNextWord recebe a frase atual e retorna a próxima palavra da IA
func (h *Handler) ChainNextWord(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if h.aiService == nil {
		SendError(w, http.StatusServiceUnavailable, "AI service not available")
		return
	}

	var req ai.ChainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.SentenceSoFar == "" {
		SendError(w, http.StatusBadRequest, "sentence_so_far is required")
		return
	}

	resp, err := h.aiService.ChainNextWord(ctx, req)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Next word generated", resp)
}
