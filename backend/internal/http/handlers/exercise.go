package handlers

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// ListExercises retorna todos os exercícios agrupados por tipo
func (h *Handler) ListExercises(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		// Se não tem user_id, busca apenas globais (userID=0)
		userID = 0
	}

	groups, err := h.exerciseService.ListGrouped(ctx, userID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Exercises retrieved", groups)
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

// ListExercisesByType retorna exercícios filtrados por tipo
func (h *Handler) ListExercisesByType(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tipo := chi.URLParam(r, "tipo")

	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		userID = 0
	}

	exs, err := h.exerciseService.GetByType(ctx, userID, tipo)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Exercises retrieved", exs)
}
