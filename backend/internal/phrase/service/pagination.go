package service

import (
	"context"

	"extension-backend/internal/phrase"
)

// GetAllPaginated busca frases paginadas com detalhes
func (s *Service) GetAllPaginated(ctx context.Context, params phrase.PaginationParams) (*phrase.PaginatedResult[phrase.PhraseWithDetails], error) {
	return s.repo.GetAllPaginated(ctx, params)
}

// GetByUserIDPaginated busca frases de um usuário paginadas com detalhes
func (s *Service) GetByUserIDPaginated(ctx context.Context, userID int, params phrase.PaginationParams) (*phrase.PaginatedResult[phrase.PhraseWithDetails], error) {
	return s.repo.GetByUserIDPaginated(ctx, userID, params)
}
