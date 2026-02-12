package service

import (
	"context"
	"fmt"

	"extension-backend/internal/anki"
)

type Service struct {
	repo anki.RepositoryInterface
}

func New(repo anki.RepositoryInterface) *Service {
	return &Service{repo: repo}
}

// GetDueCards retorna os cards que precisam ser revisados agora
func (s *Service) GetDueCards(ctx context.Context, userID int) ([]anki.AnkiCard, error) {
	cards, err := s.repo.GetDueCards(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get due cards: %w", err)
	}
	if cards == nil {
		cards = []anki.AnkiCard{}
	}
	return cards, nil
}

// SubmitReview processa a resposta do usuário usando o algoritmo SM-2
func (s *Service) SubmitReview(ctx context.Context, userID int, input anki.ReviewInput) (*anki.ReviewResult, error) {
	// Validar nota
	if input.Nota < 1 || input.Nota > 4 {
		return nil, fmt.Errorf("nota must be between 1 and 4")
	}

	// Buscar card atual
	card, err := s.repo.GetByID(ctx, input.AnkiID)
	if err != nil {
		return nil, fmt.Errorf("card not found: %w", err)
	}

	// Calcular SM-2
	result := anki.CalculateSM2(
		card.Facilidade,
		card.Intervalo,
		card.Repeticoes,
		card.SequenciaAcertos,
		input.Nota,
	)

	// Atualizar progresso no banco
	err = s.repo.UpdateProgress(
		ctx,
		card.ID,
		result.NovaFacilidade,
		result.NovoIntervalo,
		result.NovasRepeticoes,
		result.NovaSequencia,
		result.NovoEstado,
		result.ProximaRevisao,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update progress: %w", err)
	}

	// Inserir no histórico
	err = s.repo.InsertHistory(ctx, card.ID, userID, input.Nota, card.Intervalo, result.NovoIntervalo)
	if err != nil {
		return nil, fmt.Errorf("failed to insert history: %w", err)
	}

	return &anki.ReviewResult{
		NovoIntervalo:  result.NovoIntervalo,
		NovaFacilidade: result.NovaFacilidade,
		ProximaRevisao: result.ProximaRevisao.Format("2006-01-02T15:04:05Z"),
		Estado:         result.NovoEstado,
	}, nil
}

// GetStats retorna as estatísticas da sessão do usuário
func (s *Service) GetStats(ctx context.Context, userID int) (*anki.SessionStats, error) {
	stats, err := s.repo.GetStats(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}
	return stats, nil
}
