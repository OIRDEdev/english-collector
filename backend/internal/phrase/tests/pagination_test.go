package tests

import (
	"context"
	"testing"
	"time"

	"extension-backend/internal/phrase"
	"extension-backend/internal/phrase/repository"

	"github.com/pashagolub/pgxmock/v4"
)

func TestGetByUserIDPaginated_FirstPage(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("error creating mock: %v", err)
	}
	defer mock.Close()

	repo := repository.New(mock)
	now := time.Now()

	// 1st page load: Uses limit + 1 to calculate "hasMore"
	mock.ExpectQuery("SELECT (.+) FROM frases f LEFT JOIN frase_detalhes d (.+) WHERE f.usuario_id = \\$1 ORDER BY f.capturado_em DESC, f.id DESC LIMIT \\$2").
		WithArgs(1, 21). // 1 (UserID), 21 (20 + 1)
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "conteudo", "idioma_origem", "url_origem", "titulo_pagina", "capturado_em",
			"traducao_completa", "explicacao", "fatias_traducoes", "modelo_ia",
		}).AddRow(
			100, 1, "Hello test", "en", "http://test.com", "Page Title", now,
			nil, nil, nil, nil, // no initial details attached for simplicity
		))

	res, err := repo.GetByUserIDPaginated(context.Background(), 1, phrase.PaginationParams{
		Limit: 20,
	})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(res.Data) != 1 {
		t.Errorf("expected length 1, got %d", len(res.Data))
	}
	if res.Data[0].Conteudo != "Hello test" {
		t.Errorf("expected Hello test string content")
	}
	if res.HasMore {
		t.Errorf("expected hasMore = false since rows <= limit")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %s", err)
	}
}

func TestGetByUserIDPaginated_CursorMode(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("error creating mock: %v", err)
	}
	defer mock.Close()

	repo := repository.New(mock)
	now := time.Now()

	// Simulating a cursor that we've received from previous payload
	cursor := &phrase.Cursor{
		CreatedAt: now,
		ID:        150,
	}

	mock.ExpectQuery("SELECT (.+) FROM frases f LEFT JOIN frase_detalhes d (.+) WHERE f.usuario_id = \\$1 AND \\(f.capturado_em, f.id\\) < \\(\\$2, \\$3\\) ORDER BY f.capturado_em DESC, f.id DESC LIMIT \\$4").
		WithArgs(1, pgxmock.AnyArg(), cursor.ID, 21).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "conteudo", "idioma_origem", "url_origem", "titulo_pagina", "capturado_em",
			"traducao_completa", "explicacao", "fatias_traducoes", "modelo_ia",
		}).AddRow(
			149, 1, "Another phrase", "en", "http://test.com", "Page Title", now.Add(-1*time.Minute),
			nil, nil, nil, nil,
		))

	res, err := repo.GetByUserIDPaginated(context.Background(), 1, phrase.PaginationParams{
		Cursor: cursor.Encode(),
		Limit:  20,
	})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(res.Data) != 1 {
		t.Errorf("expected length 1, got %d", len(res.Data))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %s", err)
	}
}
