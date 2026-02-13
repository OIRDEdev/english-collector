package service

import (
	"context"
	"fmt"

	"extension-backend/internal/exercises"
)

type Service struct {
	repo exercises.RepositoryInterface
}

func New(repo exercises.RepositoryInterface) *Service {
	return &Service{repo: repo}
}

// GetByID busca um exercício por ID
func (s *Service) GetByID(ctx context.Context, id int) (*exercises.Exercicio, error) {
	ex, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("exercise not found: %w", err)
	}
	return ex, nil
}

// ListTiposComCatalogo retorna tipos agrupados com seus catálogos
// Usado na tela /exercises para mostrar as categorias e exercícios disponíveis
func (s *Service) ListTiposComCatalogo(ctx context.Context) ([]exercises.TipoComCatalogo, error) {
	tipos, err := s.repo.ListTipos(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list tipos: %w", err)
	}

	catalogos, err := s.repo.ListCatalogo(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list catalogo: %w", err)
	}

	// Agrupar catálogos por tipo_id
	catalogoMap := make(map[int][]exercises.CatalogoItem)
	for _, c := range catalogos {
		catalogoMap[c.TipoID] = append(catalogoMap[c.TipoID], c)
	}

	// Montar resposta
	var result []exercises.TipoComCatalogo
	for _, tipo := range tipos {
		cats := catalogoMap[tipo.ID]
		if cats == nil {
			cats = []exercises.CatalogoItem{}
		}
		result = append(result, exercises.TipoComCatalogo{
			Tipo:      tipo,
			Catalogos: cats,
		})
	}

	return result, nil
}

// GetExerciciosByCatalogo retorna até `limit` exercícios de um catálogo
func (s *Service) GetExerciciosByCatalogo(ctx context.Context, catalogoID int, limit int) ([]exercises.Exercicio, error) {
	if limit <= 0 || limit > 10 {
		limit = 3
	}

	exs, err := s.repo.GetByCatalogoID(ctx, catalogoID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get exercises for catalogo %d: %w", catalogoID, err)
	}
	if exs == nil {
		exs = []exercises.Exercicio{}
	}
	return exs, nil
}
