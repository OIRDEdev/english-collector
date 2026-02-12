package anki

import (
	"context"
	"time"
)

// RepositoryInterface define as operações de acesso a dados do Anki
type RepositoryInterface interface {
	GetDueCards(ctx context.Context, userID int) ([]AnkiCard, error)
	GetByID(ctx context.Context, id int) (*AnkiCard, error)
	UpdateProgress(ctx context.Context, id int, facilidade float64, intervalo int, repeticoes int, sequencia int, estado string, proxRevisao time.Time) error
	InsertHistory(ctx context.Context, ankiID, userID, nota, intervaloAnterior, novoIntervalo int) error
	GetStats(ctx context.Context, userID int) (*SessionStats, error)
}

// ServiceInterface define a lógica de negócio do Anki
type ServiceInterface interface {
	GetDueCards(ctx context.Context, userID int) ([]AnkiCard, error)
	SubmitReview(ctx context.Context, userID int, input ReviewInput) (*ReviewResult, error)
	GetStats(ctx context.Context, userID int) (*SessionStats, error)
}
