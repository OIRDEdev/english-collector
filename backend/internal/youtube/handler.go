package youtube

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service Service
}

func NewHandler(s Service) *Handler {
	return &Handler{
		service: s,
	}
}

func (h *Handler) GetTranscript(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "id")
	if videoID == "" {
		http.Error(w, "missing video ID", http.StatusBadRequest)
		return
	}
	
	lang := r.URL.Query().Get("lang")

	transcript, err := h.service.GetTranscript(r.Context(), videoID, lang)
	if err != nil {
		http.Error(w, "failed to fetch transcript: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(transcript); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}
