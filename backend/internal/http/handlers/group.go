package handlers

import (
	"net/http"

	"extension-backend/internal/group"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListGroups(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	groups, err := h.groupService.GetAll(ctx)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Groups retrieved", groups)
}

func (h *Handler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input group.CreateInput
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	created, err := h.groupService.Create(ctx, input)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusCreated, "Group created", created)
}

func (h *Handler) GetGroup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	g, err := h.groupService.GetByID(ctx, id)
	if err != nil {
		SendError(w, http.StatusNotFound, "group not found")
		return
	}

	SendSuccess(w, http.StatusOK, "Group retrieved", g)
}

func (h *Handler) UpdateGroup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input group.UpdateInput
	if err := DecodeJSON(r, &input); err != nil {
		SendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.groupService.Update(ctx, id, input)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Group updated", updated)
}

func (h *Handler) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	if err := h.groupService.Delete(ctx, id); err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, http.StatusOK, "Group deleted", nil)
}
