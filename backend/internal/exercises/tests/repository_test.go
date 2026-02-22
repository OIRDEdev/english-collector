package tests

import (
	"context"
	"fmt"
	"testing"
	"time"

	"extension-backend/internal/exercises/repository"

	"github.com/pashagolub/pgxmock/v4"
)

// ================================================
// Helpers
// ================================================

func setupMock(t *testing.T) (pgxmock.PgxPoolIface, *repository.Repository) {
	t.Helper()
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	repo := repository.NewWithDB(mock)
	return mock, repo
}

// ================================================
// TESTS
// ================================================

func TestListTipos_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	mock.ExpectQuery("SELECT (.+) FROM tipos_exercicio ORDER BY id").
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "nome", "descricao", "criado_em"},
		).AddRow(1, "Translation", "Translate sentences", now))

	tipos, err := repo.ListTipos(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(tipos) != 1 {
		t.Errorf("expected 1 tipo, got %d", len(tipos))
	}
}

func TestListCatalogo_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM exercicios_catalogo c JOIN tipos_exercicio t").
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "nome", "descricao", "tipo_id", "tipo_nome", "ativo"},
		).AddRow(1, "Cat 1", "Desc 1", 2, "Tradução", true))

	catalogo, err := repo.ListCatalogo(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(catalogo) != 1 {
		t.Errorf("expected 1 item, got %d", len(catalogo))
	}
}

func TestGetCatalogoByTipo_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM exercicios_catalogo c JOIN tipos_exercicio t").
		WithArgs(2).
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "nome", "descricao", "tipo_id", "tipo_nome", "ativo"},
		).AddRow(1, "Cat 1", "Desc 1", 2, "Tradução", true))

	catalogo, err := repo.GetCatalogoByTipo(context.Background(), 2)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(catalogo) != 1 {
		t.Errorf("expected 1 item, got %d", len(catalogo))
	}
}

func TestGetByID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	dadosJSON := []byte(`{"text":"hello"}`)
	userID := 1
	mock.ExpectQuery("SELECT (.+) FROM exercicios WHERE id").
		WithArgs(42).
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "usuario_id", "catalogo_id", "dados_exercicio", "nivel", "criado_em"},
		).AddRow(42, &userID, 10, dadosJSON, 1, now))

	ex, err := repo.GetByID(context.Background(), 42)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if ex.ID != 42 {
		t.Errorf("expected ID=42, got %d", ex.ID)
	}
	if ex.DadosExercicio == nil {
		t.Errorf("expected DadosExercicio to be unmarshaled, got nil")
	}
}

func TestGetByID_NotFound(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM exercicios WHERE id").
		WithArgs(999).
		WillReturnError(fmt.Errorf("no rows in result set"))

	_, err := repo.GetByID(context.Background(), 999)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestGetByCatalogoID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	dadosJSON := []byte(`{"text":"hello"}`)
	userID := 1
	mock.ExpectQuery("SELECT (.+) FROM exercicios WHERE catalogo_id").
		WithArgs(10, 5).
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "usuario_id", "catalogo_id", "dados_exercicio", "nivel", "criado_em"},
		).AddRow(42, &userID, 10, dadosJSON, 1, now))

	exs, err := repo.GetByCatalogoID(context.Background(), 10, 5)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(exs) != 1 {
		t.Fatalf("expected 1 item, got %d", len(exs))
	}
	if exs[0].DadosExercicio == nil {
		t.Errorf("expected DadosExercicio to be unmarshaled, got nil")
	}
}
