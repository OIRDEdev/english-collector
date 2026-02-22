package tests

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"extension-backend/internal/group"

	"github.com/pashagolub/pgxmock/v4"
)

// ================================================
// Helpers
// ================================================

func setupMock(t *testing.T) (pgxmock.PgxPoolIface, *group.Repository) {
	t.Helper()
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	repo := group.NewWithDB(mock)
	return mock, repo
}

// ================================================
// TESTS
// ================================================

func TestCreate_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	g := &group.Group{
		UsuarioID:    1,
		NomeGrupo:    "My Group",
		Descricao:    "Group description",
		CorEtiqueta:  "#FF0000",
	}

	mock.ExpectQuery("INSERT INTO grupos").
		WithArgs(g.UsuarioID, g.NomeGrupo, g.Descricao, g.CorEtiqueta).
		WillReturnRows(pgxmock.NewRows([]string{"id", "criado_em"}).AddRow(1, now))

	err := repo.Create(context.Background(), g)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if g.ID != 1 {
		t.Errorf("expected ID=1, got %d", g.ID)
	}
	if g.CriadoEm.IsZero() {
		t.Error("expected CriadoEm to be set")
	}
}

func TestGetByID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	mock.ExpectQuery("SELECT (.+) FROM grupos WHERE id").
		WithArgs(42).
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "usuario_id", "nome_grupo", "descricao", "cor_etiqueta", "criado_em"},
		).AddRow(42, 1, "My Group", "Desc", "#000", now))

	g, err := repo.GetByID(context.Background(), 42)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if g.ID != 42 {
		t.Errorf("expected ID=42, got %d", g.ID)
	}
	if g.NomeGrupo != "My Group" {
		t.Errorf("expected 'My Group', got '%s'", g.NomeGrupo)
	}
}

func TestGetByID_NotFound(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM grupos WHERE id").
		WithArgs(999).
		WillReturnError(fmt.Errorf("no rows in result set"))

	_, err := repo.GetByID(context.Background(), 999)
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "group not found") {
		t.Errorf("expected 'group not found' error, got %v", err)
	}
}

func TestGetByUserID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	mock.ExpectQuery("SELECT (.+) FROM grupos WHERE usuario_id").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "usuario_id", "nome_grupo", "descricao", "cor_etiqueta", "criado_em"},
		).AddRow(1, 1, "Grp1", "D", "#0", now))

	groups, err := repo.GetByUserID(context.Background(), 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(groups) != 1 {
		t.Errorf("expected 1 group, got %d", len(groups))
	}
}

func TestGetAll_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	mock.ExpectQuery("SELECT (.+) FROM grupos ORDER BY").
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "usuario_id", "nome_grupo", "descricao", "cor_etiqueta", "criado_em"},
		).AddRow(1, 1, "Grp1", "D", "#0", now))

	groups, err := repo.GetAll(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(groups) != 1 {
		t.Errorf("expected 1 group, got %d", len(groups))
	}
}

func TestUpdate_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	g := &group.Group{
		ID:           1,
		NomeGrupo:    "Updated",
		Descricao:    "Desc",
		CorEtiqueta:  "#FFF",
	}

	mock.ExpectExec("UPDATE grupos SET").
		WithArgs(g.NomeGrupo, g.Descricao, g.CorEtiqueta, g.ID).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err := repo.Update(context.Background(), g)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestDelete_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectExec("DELETE FROM grupos WHERE").
		WithArgs(42).
		WillReturnResult(pgxmock.NewResult("DELETE", 1))

	err := repo.Delete(context.Background(), 42)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestAddPhraseToGroup_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectExec("INSERT INTO frase_grupos").
		WithArgs(10, 20).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err := repo.AddPhraseToGroup(context.Background(), 10, 20)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestRemovePhraseFromGroup_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectExec("DELETE FROM frase_grupos WHERE").
		WithArgs(10, 20).
		WillReturnResult(pgxmock.NewResult("DELETE", 1))

	err := repo.RemovePhraseFromGroup(context.Background(), 10, 20)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestGetPhraseGroups_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	mock.ExpectQuery("SELECT (.+) FROM grupos g INNER JOIN frase_grupos").
		WithArgs(10).
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "usuario_id", "nome_grupo", "descricao", "cor_etiqueta", "criado_em"},
		).AddRow(1, 1, "Grp", "Desc", "#F", now))

	groups, err := repo.GetPhraseGroups(context.Background(), 10)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(groups) != 1 {
		t.Errorf("expected 1 group, got %d", len(groups))
	}
}
