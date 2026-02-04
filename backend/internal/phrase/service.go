package phrase

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

func (s *Service) Create(ctx context.Context, input CreateInput) (*Phrase, error) {
	idioma := input.IdiomaOrigem
	if idioma == "" {
		idioma = "en"
	}

	p := &Phrase{
		UsuarioID:    input.UsuarioID,
		Conteudo:     input.Conteudo,
		IdiomaOrigem: idioma,
		URLOrigem:    input.URLOrigem,
		TituloPagina: input.TituloPagina,
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Phrase, error) {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id")
	}
	return s.repo.GetByID(ctx, intID)
}

func (s *Service) GetByUserID(ctx context.Context, userID int) ([]Phrase, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *Service) GetAll(ctx context.Context) ([]Phrase, error) {
	return s.repo.GetAll(ctx)
}

func (s *Service) Update(ctx context.Context, id string, input UpdateInput) (*Phrase, error) {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id")
	}

	p, err := s.repo.GetByID(ctx, intID)
	if err != nil {
		return nil, err
	}

	if input.Conteudo != "" {
		p.Conteudo = input.Conteudo
	}
	if input.IdiomaOrigem != "" {
		p.IdiomaOrigem = input.IdiomaOrigem
	}

	if err := s.repo.Update(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return fmt.Errorf("invalid id")
	}
	return s.repo.Delete(ctx, intID)
}

func (s *Service) Search(ctx context.Context, userID int, term string) ([]Phrase, error) {
	return s.repo.Search(ctx, userID, term)
}

func (s *Service) AddDetails(ctx context.Context, input CreateDetailsInput) (*PhraseDetails, error) {
	d := &PhraseDetails{
		FraseID:          input.FraseID,
		TraducaoCompleta: input.TraducaoCompleta,
		Explicacao:       input.Explicacao,
		FatiasTraducoes:  input.FatiasTraducoes,
		ModeloIA:         input.ModeloIA,
	}

	if err := s.repo.CreateDetails(ctx, d); err != nil {
		return nil, err
	}
	return d, nil
}

func (s *Service) GetDetails(ctx context.Context, phraseID int) (*PhraseDetails, error) {
	return s.repo.GetDetailsByPhraseID(ctx, phraseID)
}
