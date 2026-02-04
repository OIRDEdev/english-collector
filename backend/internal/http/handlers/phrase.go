package handlers

import (
	"net/http"

	"extension-backend/internal/phrase"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListPhrases(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	phrases, err := h.phraseService.GetAll(ctx)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Phrases retrieved", phrases)
}

func (h *Handler) CreatePhrase(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input phrase.CreateInput
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	created, err := h.phraseService.Create(ctx, input)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusCreated, "Phrase created", created)
}

func (h *Handler) GetPhrase(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	p, err := h.phraseService.GetByID(ctx, id)
	if err != nil {
		SendError(w, http.StatusNotFound, "phrase not found")
		return
	}

	SendSuccess(w, http.StatusOK, "Phrase retrieved", p)
}

func (h *Handler) UpdatePhrase(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input phrase.UpdateInput
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.phraseService.Update(ctx, id, input)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Phrase updated", updated)
}

func (h *Handler) DeletePhrase(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	if err := h.phraseService.Delete(ctx, id); err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Phrase deleted", nil)
}
