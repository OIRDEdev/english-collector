package handlers

import (
	"net/http"

	"extension-backend/internal/user"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	users, err := h.userService.GetAll(ctx)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Users retrieved", users)
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input user.CreateInput
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	created, err := h.userService.Create(ctx, input)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusCreated, "User created", created)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	u, err := h.userService.GetByID(ctx, id)
	if err != nil {
		SendError(w, http.StatusNotFound, "user not found")
		return
	}

	SendSuccess(w, http.StatusOK, "User retrieved", u)
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input user.UpdateInput
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.userService.Update(ctx, id, input)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "User updated", updated)
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	if err := h.userService.Delete(ctx, id); err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "User deleted", nil)
}
