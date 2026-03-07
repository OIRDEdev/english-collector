package repository_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"extension-backend/internal/anki/repository"

	"github.com/pashagolub/pgxmock/v4"
)

// setupMock cria um mock para a conexão do banco e inicializa o Repository do Anki.
func setupMock(t *testing.T) (pgxmock.PgxPoolIface, *repository.Repository) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	repo := repository.New(mock)
	return mock, repo
}

func TestGetDueCards_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	fatias := []map[string]interface{}{{"word": "hello"}}
	fatiasJSON, _ := json.Marshal(fatias)

	// query with ORDER BY ...
	mock.ExpectQuery("SELECT (.+) FROM anki_progresso ap JOIN frases f (.+) LEFT JOIN frase_detalhes fd (.+)").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "frase_id", "conteudo", "traducao_completa", "fatias_traducoes",
			"facilidade", "intervalo", "repeticoes", "sequencia_acertos", "estado", "proxima_revisao",
		}).AddRow(
			100, 200, "Hello world", "Olá mundo", fatiasJSON,
			2.5, 1, 1, 1, "revisao", now,
		))

	cards, err := repo.GetDueCards(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(cards) != 1 {
		t.Fatalf("expected 1 card, got %d", len(cards))
	}
	if cards[0].ID != 100 || cards[0].Conteudo != "Hello world" {
		t.Errorf("unexpected card data: %+v", cards[0])
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestGetByID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()

	mock.ExpectQuery("SELECT (.+) FROM anki_progresso ap JOIN frases f (.+) LEFT JOIN frase_detalhes fd (.+) WHERE ap.id = \\$1").
		WithArgs(100).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "frase_id", "conteudo", "traducao_completa", "fatias_traducoes",
			"facilidade", "intervalo", "repeticoes", "sequencia_acertos", "estado", "proxima_revisao",
		}).AddRow(
			100, 200, "Test", "Teste", nil,
			2.5, 0, 0, 0, "novo", now,
		))

	card, err := repo.GetByID(context.Background(), 100)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if card == nil || card.ID != 100 {
		t.Errorf("unexpected card data")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestGetByID_NotFound(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM anki_progresso ap (.+) WHERE ap.id = \\$1").
		WithArgs(999).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "frase_id", "conteudo", "traducao_completa", "fatias_traducoes",
			"facilidade", "intervalo", "repeticoes", "sequencia_acertos", "estado", "proxima_revisao",
		}))

	_, err := repo.GetByID(context.Background(), 999)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestUpdateProgress_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()

	mock.ExpectExec("UPDATE anki_progresso SET facilidade = \\$2, intervalo = \\$3, repeticoes = \\$4, sequencia_acertos = \\$5, estado = \\$6, proxima_revisao = \\$7, ultima_revisao = CURRENT_TIMESTAMP WHERE id = \\$1").
		WithArgs(100, 2.6, 3, 2, 2, "revisao", now).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err := repo.UpdateProgress(context.Background(), 100, 2.6, 3, 2, 2, "revisao", now)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestInsertHistory_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectExec("INSERT INTO anki_historico \\(anki_id, usuario_id, nota, intervalo_anterior, novo_intervalo\\) VALUES \\(\\$1, \\$2, \\$3, \\$4, \\$5\\)").
		WithArgs(100, 1, 4, 1, 3).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err := repo.InsertHistory(context.Background(), 100, 1, 4, 1, 3)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestGetStats_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM anki_progresso WHERE usuario_id = \\$1").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{
			"total_cards", "due_today", "novos", "aprendendo", "revisao",
		}).AddRow(150, 20, 10, 5, 135))

	stats, err := repo.GetStats(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if stats.TotalCards != 150 || stats.DueToday != 20 {
		t.Errorf("unexpected stats data: %+v", stats)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}
