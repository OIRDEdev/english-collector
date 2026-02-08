package service

import (
	"context"
	"fmt"
	"strconv"

	"extension-backend/internal/phrase"
)

// Create cria uma nova frase
func (s *Service) Create(ctx context.Context, input phrase.CreateInput) (*phrase.Phrase, error) {
	idioma := input.IdiomaOrigem
	if idioma == "" {
		idioma = "en"
	}

	p := &phrase.Phrase{
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

// GetByID busca frase por ID
func (s *Service) GetByID(ctx context.Context, id string) (*phrase.Phrase, error) {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id")
	}
	return s.repo.GetByID(ctx, intID)
}

// GetByUserID lista frases de um usuário
func (s *Service) GetByUserID(ctx context.Context, userID int) ([]phrase.Phrase, error) {
	return s.repo.GetByUserID(ctx, userID)
}

// GetAll lista todas as frases
func (s *Service) GetAll(ctx context.Context) ([]phrase.Phrase, error) {
	return s.repo.GetAll(ctx)
}

// Update atualiza uma frase
func (s *Service) Update(ctx context.Context, id string, input phrase.UpdateInput) (*phrase.Phrase, error) {
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

// Delete remove uma frase
func (s *Service) Delete(ctx context.Context, id string) error {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return fmt.Errorf("invalid id")
	}
	return s.repo.Delete(ctx, intID)
}

// Search busca frases por termo
func (s *Service) Search(ctx context.Context, userID int, term string) ([]phrase.Phrase, error) {
	return s.repo.Search(ctx, userID, term)
}

// AddDetails adiciona detalhes de tradução
func (s *Service) AddDetails(ctx context.Context, input phrase.CreateDetailsInput) (*phrase.PhraseDetails, error) {
	d := &phrase.PhraseDetails{
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

// GetDetails busca detalhes de uma frase
func (s *Service) GetDetails(ctx context.Context, phraseID int) (*phrase.PhraseDetails, error) {
	return s.repo.GetDetailsByPhraseID(ctx, phraseID)
}
