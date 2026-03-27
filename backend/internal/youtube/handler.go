package youtube

import (
	"encoding/json"
	"net/http"
	"strconv"

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
	native := r.URL.Query().Get("native")
	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")

	var start, end float64
	if startStr != "" {
		start, _ = strconv.ParseFloat(startStr, 64)
	}
	if endStr != "" {
		end, _ = strconv.ParseFloat(endStr, 64)
	}

	transcript, err := h.service.GetTranscript(r.Context(), videoID, lang, native, start, end)
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
