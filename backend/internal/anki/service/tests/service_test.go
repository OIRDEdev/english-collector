package service_test

import (
	"context"
	"testing"
	"time"

	"extension-backend/internal/anki"
	"extension-backend/internal/anki/repository"
	"extension-backend/internal/anki/service"

	"github.com/pashagolub/pgxmock/v4"
)

func setupServiceMock(t *testing.T) (pgxmock.PgxPoolIface, *service.Service) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	repo := repository.New(mock)
	svc := service.New(repo)
	return mock, svc
}

func TestService_GetDueCards_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	// Empty array return testing
	mock.ExpectQuery("SELECT (.+) FROM anki_progresso").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "frase_id", "conteudo", "traducao_completa", "fatias_traducoes",
			"facilidade", "intervalo", "repeticoes", "sequencia_acertos", "estado", "proxima_revisao",
		}))

	cards, err := svc.GetDueCards(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if cards == nil {
		t.Errorf("expected empty array allocation, got nil")
	}
	if len(cards) != 0 {
		t.Errorf("expected length 0")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestService_SubmitReview_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	input := anki.ReviewInput{
		AnkiID: 100,
		Nota:   4, // Easy
	}

	now := time.Now()

	// 1. Get the current card
	mock.ExpectQuery("SELECT (.+) FROM anki_progresso ap (.+) WHERE ap.id = \\$1").
		WithArgs(100).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "frase_id", "conteudo", "traducao_completa", "fatias_traducoes",
			"facilidade", "intervalo", "repeticoes", "sequencia_acertos", "estado", "proxima_revisao",
		}).AddRow(
			100, 200, "Test", "Teste", nil,
			2.5, 0, 0, 0, "novo", now,
		))

	// The logic inside CalculateSM2 ensures interval=1 on first grade 4 if repetitive params are 0
	// 2. Perform the SRS Update
	mock.ExpectExec("UPDATE anki_progresso SET facilidade = \\$2, intervalo = \\$3, repeticoes = \\$4, sequencia_acertos = \\$5, estado = \\$6, proxima_revisao = \\$7, ultima_revisao = CURRENT_TIMESTAMP WHERE id = \\$1").
		WithArgs(100, 2.5, 1, 1, 1, "revisao", pgxmock.AnyArg()).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// 3. Log into History
	mock.ExpectExec("INSERT INTO anki_historico").
		WithArgs(100, 1, 4, 0, 1). // anki_id, user_id, nota, prev_interval, new_interval
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	res, err := svc.SubmitReview(context.Background(), 1, input)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if res.NovaFacilidade != 2.5 {
		t.Errorf("expected adjusted facilidade 2.5, got %f", res.NovaFacilidade)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestService_SubmitReview_InvalidNota(t *testing.T) {
	_, svc := setupServiceMock(t)

	// Nota is bounded 1..4
	_, err := svc.SubmitReview(context.Background(), 1, anki.ReviewInput{
		AnkiID: 100,
		Nota:   5,
	})

	if err == nil {
		t.Fatal("expected bound validation error, got nil")
	}
}

func TestService_GetStats_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM anki_progresso WHERE usuario_id = \\$1").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{
			"total_cards", "due_today", "novos", "aprendendo", "revisao",
		}).AddRow(100, 5, 0, 0, 100))

	stats, err := svc.GetStats(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if stats.DueToday != 5 {
		t.Errorf("expected 5 due cards, got %d", stats.DueToday)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}
