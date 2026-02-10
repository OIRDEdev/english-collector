package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	"extension-backend/internal/phrase"

	"github.com/pashagolub/pgxmock/v4"
)

// ================================================
// CREATE DETAILS
// ================================================

func TestCreateDetails_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	fatias := map[string]string{"hello": "olá", "world": "mundo"}
	fatiasJSON, _ := json.Marshal(fatias)

	d := &phrase.PhraseDetails{
		FraseID:          1,
		TraducaoCompleta: "Olá mundo",
		Explicacao:       "Saudação básica",
		FatiasTraducoes:  fatias,
		ModeloIA:         "gemini-2.0-flash",
	}

	mock.ExpectQuery("INSERT INTO frase_detalhes").
		WithArgs(d.FraseID, d.TraducaoCompleta, d.Explicacao, fatiasJSON, d.ModeloIA).
		WillReturnRows(pgxmock.NewRows([]string{"id", "processado_em"}).AddRow(1, now))

	err := repo.CreateDetails(context.Background(), d)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if d.ID != 1 {
		t.Errorf("expected ID=1, got %d", d.ID)
	}
	if d.ProcessadoEm.IsZero() {
		t.Error("expected ProcessadoEm to be set")
	}
}

func TestCreateDetails_DBError(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	d := &phrase.PhraseDetails{
		FraseID:          999,
		TraducaoCompleta: "Test",
		FatiasTraducoes:  map[string]string{},
	}
	fatiasJSON, _ := json.Marshal(d.FatiasTraducoes)

	mock.ExpectQuery("INSERT INTO frase_detalhes").
		WithArgs(d.FraseID, d.TraducaoCompleta, d.Explicacao, fatiasJSON, d.ModeloIA).
		WillReturnError(fmt.Errorf("foreign key violation"))

	err := repo.CreateDetails(context.Background(), d)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "foreign key violation") {
		t.Errorf("expected foreign key error, got: %v", err)
	}
}

// ================================================
// GET DETAILS BY PHRASE ID
// ================================================

func TestGetDetailsByPhraseID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	fatias := map[string]string{"hello": "olá"}
	fatiasJSON, _ := json.Marshal(fatias)

	mock.ExpectQuery("SELECT (.+) FROM frase_detalhes WHERE frase_id").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows(
			[]string{"id", "frase_id", "traducao_completa", "explicacao", "fatias_traducoes", "modelo_ia", "processado_em"},
		).AddRow(1, 1, "Olá", "Saudação", fatiasJSON, "gemini-2.0-flash", now))

	d, err := repo.GetDetailsByPhraseID(context.Background(), 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if d.TraducaoCompleta != "Olá" {
		t.Errorf("expected 'Olá', got '%s'", d.TraducaoCompleta)
	}
	if d.FatiasTraducoes["hello"] != "olá" {
		t.Errorf("expected fatias[hello]='olá', got '%s'", d.FatiasTraducoes["hello"])
	}
	if d.ModeloIA != "gemini-2.0-flash" {
		t.Errorf("expected 'gemini-2.0-flash', got '%s'", d.ModeloIA)
	}
}

func TestGetDetailsByPhraseID_NotFound(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM frase_detalhes WHERE frase_id").
		WithArgs(999).
		WillReturnError(fmt.Errorf("no rows in result set"))

	_, err := repo.GetDetailsByPhraseID(context.Background(), 999)
	if err == nil {
		t.Fatal("expected error for non-existent details")
	}
}
