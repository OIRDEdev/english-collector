package tests

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"extension-backend/internal/phrase"
	"extension-backend/internal/phrase/repository"

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
// CREATE
// ================================================

func TestCreate_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	p := &phrase.Phrase{
		UsuarioID:    1,
		Conteudo:     "Hello world",
		IdiomaOrigem: "en",
		URLOrigem:    "https://example.com",
		TituloPagina: "Example",
	}

	mock.ExpectQuery("INSERT INTO frases").
		WithArgs(p.UsuarioID, p.Conteudo, p.IdiomaOrigem, p.URLOrigem, p.TituloPagina).
		WillReturnRows(pgxmock.NewRows([]string{"id", "capturado_em"}).AddRow(1, now))

	err := repo.Create(context.Background(), p)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if p.ID != 1 {
		t.Errorf("expected ID=1, got %d", p.ID)
	}
	if p.CapturadoEm.IsZero() {
		t.Error("expected CapturadoEm to be set")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestCreate_DBError(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	p := &phrase.Phrase{
		UsuarioID:    1,
		Conteudo:     "Hello",
		IdiomaOrigem: "en",
	}

	mock.ExpectQuery("INSERT INTO frases").
		WithArgs(p.UsuarioID, p.Conteudo, p.IdiomaOrigem, p.URLOrigem, p.TituloPagina).
		WillReturnError(fmt.Errorf("connection refused"))

	err := repo.Create(context.Background(), p)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "connection refused") {
		t.Errorf("expected 'connection refused' error, got: %v", err)
	}
}

// ================================================
// GET BY ID
// ================================================

func TestGetByID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	mock.ExpectQuery("SELECT (.+) FROM frases WHERE id").
		WithArgs(42).
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "usuario_id", "conteudo", "idioma_origem", "url_origem", "titulo_pagina", "capturado_em"},
		).AddRow(42, 1, "Test phrase", "en", "https://test.com", "Test", now))

	p, err := repo.GetByID(context.Background(), 42)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if p.ID != 42 {
		t.Errorf("expected ID=42, got %d", p.ID)
	}
	if p.Conteudo != "Test phrase" {
		t.Errorf("expected 'Test phrase', got '%s'", p.Conteudo)
	}
}

func TestGetByID_NotFound(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM frases WHERE id").
		WithArgs(999).
		WillReturnError(fmt.Errorf("no rows in result set"))

	_, err := repo.GetByID(context.Background(), 999)
	if err == nil {
		t.Fatal("expected error for non-existent phrase")
	}
	if !strings.Contains(err.Error(), "phrase not found") {
		t.Errorf("expected 'phrase not found' error, got: %v", err)
	}
}

// ================================================
// GET BY USER ID
// ================================================

func TestGetByUserID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	rows := pgxmock.NewRows(
		[]string{"id", "usuario_id", "conteudo", "idioma_origem", "url_origem", "titulo_pagina", "capturado_em"},
	).
		AddRow(1, 5, "Phrase 1", "en", "", "Page 1", now).
		AddRow(2, 5, "Phrase 2", "en", "", "Page 2", now)

	mock.ExpectQuery("SELECT (.+) FROM frases WHERE usuario_id").
		WithArgs(5).
		WillReturnRows(rows)

	phrases, err := repo.GetByUserID(context.Background(), 5)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(phrases) != 2 {
		t.Fatalf("expected 2 phrases, got %d", len(phrases))
	}
	if phrases[0].Conteudo != "Phrase 1" {
		t.Errorf("expected 'Phrase 1', got '%s'", phrases[0].Conteudo)
	}
}

func TestGetByUserID_Empty(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	rows := pgxmock.NewRows(
		[]string{"id", "usuario_id", "conteudo", "idioma_origem", "url_origem", "titulo_pagina", "capturado_em"},
	)

	mock.ExpectQuery("SELECT (.+) FROM frases WHERE usuario_id").
		WithArgs(999).
		WillReturnRows(rows)

	phrases, err := repo.GetByUserID(context.Background(), 999)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(phrases) != 0 {
		t.Errorf("expected empty list, got %d phrases", len(phrases))
	}
}

// ================================================
// GET ALL
// ================================================

func TestGetAll_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	rows := pgxmock.NewRows(
		[]string{"id", "usuario_id", "conteudo", "idioma_origem", "url_origem", "titulo_pagina", "capturado_em"},
	).
		AddRow(1, 1, "Hello", "en", "", "", now).
		AddRow(2, 2, "World", "en", "", "", now).
		AddRow(3, 1, "Goodbye", "en", "", "", now)

	mock.ExpectQuery("SELECT (.+) FROM frases ORDER BY").
		WillReturnRows(rows)

	phrases, err := repo.GetAll(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(phrases) != 3 {
		t.Errorf("expected 3 phrases, got %d", len(phrases))
	}
}

func TestGetAll_DBError(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM frases ORDER BY").
		WillReturnError(fmt.Errorf("database unavailable"))

	_, err := repo.GetAll(context.Background())
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// ================================================
// UPDATE
// ================================================

func TestUpdate_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	p := &phrase.Phrase{
		ID:           1,
		Conteudo:     "Updated content",
		IdiomaOrigem: "pt",
	}

	mock.ExpectExec("UPDATE frases SET").
		WithArgs(p.Conteudo, p.IdiomaOrigem, p.ID).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err := repo.Update(context.Background(), p)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

// ================================================
// DELETE
// ================================================

func TestDelete_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectExec("DELETE FROM frases WHERE").
		WithArgs(42).
		WillReturnResult(pgxmock.NewResult("DELETE", 1))

	err := repo.Delete(context.Background(), 42)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestDelete_DBError(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectExec("DELETE FROM frases WHERE").
		WithArgs(42).
		WillReturnError(fmt.Errorf("foreign key constraint"))

	err := repo.Delete(context.Background(), 42)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// ================================================
// SEARCH
// ================================================

func TestSearch_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	rows := pgxmock.NewRows(
		[]string{"id", "usuario_id", "conteudo", "idioma_origem", "url_origem", "titulo_pagina", "capturado_em"},
	).AddRow(1, 5, "Hello world", "en", "", "", now)

	mock.ExpectQuery("SELECT (.+) FROM frases WHERE usuario_id").
		WithArgs(5, "hello").
		WillReturnRows(rows)

	phrases, err := repo.Search(context.Background(), 5, "hello")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(phrases) != 1 {
		t.Errorf("expected 1 phrase, got %d", len(phrases))
	}
}

func TestSearch_NoResults(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	rows := pgxmock.NewRows(
		[]string{"id", "usuario_id", "conteudo", "idioma_origem", "url_origem", "titulo_pagina", "capturado_em"},
	)

	mock.ExpectQuery("SELECT (.+) FROM frases WHERE usuario_id").
		WithArgs(5, "nonexistent").
		WillReturnRows(rows)

	phrases, err := repo.Search(context.Background(), 5, "nonexistent")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(phrases) != 0 {
		t.Errorf("expected empty list, got %d", len(phrases))
	}
}
