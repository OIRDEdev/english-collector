package group

import (
	"context"
	"fmt"
	"strconv"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, input CreateInput) (*Group, error) {
	g := &Group{
		UsuarioID:   input.UsuarioID,
		NomeGrupo:   input.NomeGrupo,
		Descricao:   input.Descricao,
		CorEtiqueta: input.CorEtiqueta,
	}

	if err := s.repo.Create(ctx, g); err != nil {
		return nil, err
	}
	return g, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Group, error) {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id")
	}
	return s.repo.GetByID(ctx, intID)
}

func (s *Service) GetByUserID(ctx context.Context, userID int) ([]Group, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *Service) GetAll(ctx context.Context) ([]Group, error) {
	return s.repo.GetAll(ctx)
}

func (s *Service) Update(ctx context.Context, id string, input UpdateInput) (*Group, error) {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id")
	}

	g, err := s.repo.GetByID(ctx, intID)
	if err != nil {
		return nil, err
	}

	if input.NomeGrupo != "" {
		g.NomeGrupo = input.NomeGrupo
	}
	if input.Descricao != "" {
		g.Descricao = input.Descricao
	}
	if input.CorEtiqueta != "" {
		g.CorEtiqueta = input.CorEtiqueta
	}

	if err := s.repo.Update(ctx, g); err != nil {
		return nil, err
	}
	return g, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return fmt.Errorf("invalid id")
	}
	return s.repo.Delete(ctx, intID)
}

func (s *Service) AddPhrase(ctx context.Context, phraseID, groupID int) error {
	return s.repo.AddPhraseToGroup(ctx, phraseID, groupID)
}

func (s *Service) RemovePhrase(ctx context.Context, phraseID, groupID int) error {
	return s.repo.RemovePhraseFromGroup(ctx, phraseID, groupID)
}

func (s *Service) GetPhraseGroups(ctx context.Context, phraseID int) ([]Group, error) {
	return s.repo.GetPhraseGroups(ctx, phraseID)
}
