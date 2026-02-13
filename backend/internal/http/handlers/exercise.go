package handlers

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// ListExercises retorna tipos + catálogos agrupados para a tela de exercícios
func (h *Handler) ListExercises(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	result, err := h.exerciseService.ListTiposComCatalogo(ctx)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Exercises catalog retrieved", result)
}

// GetExercise retorna um exercício específico por ID
func (h *Handler) GetExercise(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		SendError(w, http.StatusBadRequest, "invalid exercise id")
		return
	}

	ex, err := h.exerciseService.GetByID(ctx, id)
	if err != nil {
		SendError(w, http.StatusNotFound, "exercise not found")
		return
	}

	SendSuccess(w, http.StatusOK, "Exercise retrieved", ex)
}

// GetExercisesByCatalogo retorna até 3 exercícios de um catálogo
func (h *Handler) GetExercisesByCatalogo(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	catalogoIDStr := chi.URLParam(r, "catalogoId")
	catalogoID, err := strconv.Atoi(catalogoIDStr)
	if err != nil {
		SendError(w, http.StatusBadRequest, "invalid catalogo_id")
		return
	}

	// Ler limit query param (default 3)
	limit := 3
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	exs, err := h.exerciseService.GetExerciciosByCatalogo(ctx, catalogoID, limit)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Exercises retrieved", exs)
}
