package repository_test

import (
	"context"
	"encoding/json"
	"testing"

	"extension-backend/internal/settings/repository"

	"github.com/pashagolub/pgxmock/v4"
)

// setupMock cria um mock para a conexão do banco e inicializa o Repository.
func setupMock(t *testing.T) (pgxmock.PgxPoolIface, *repository.Repository) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	repo := repository.New(mock)
	return mock, repo
}

func TestGetByUserID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	configMap := map[string]interface{}{"theme": "light"}
	configJSON, _ := json.Marshal(configMap)

	mock.ExpectQuery("SELECT (.+) FROM preferencias_usuario WHERE usuario_id = \\$1").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "idioma_padrao_traducao", "auto_traduzir", "tema_interface",
			"nivel_proficiencia", "minutos_diarios", "cards_diarios", "onboarding_completo", "config",
		}).AddRow(
			1, 1, "pt-BR", true, "dark",
			"advanced", 30, 20, true, configJSON,
		))

	settings, err := repo.GetByUserID(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if settings.ID != 1 || settings.UsuarioID != 1 || settings.IdiomaPadraoTraducao != "pt-BR" {
		t.Errorf("unexpected settings data: %+v", settings)
	}
	if settings.Config["theme"] != "light" {
		t.Errorf("failed to parse JSON config, got: %v", settings.Config)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestGetByUserID_NotFound(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM preferencias_usuario WHERE usuario_id = \\$1").
		WithArgs(999).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "idioma_padrao_traducao", "auto_traduzir", "tema_interface",
			"nivel_proficiencia", "minutos_diarios", "cards_diarios", "onboarding_completo", "config",
		})) // Empty rows

	settings, err := repo.GetByUserID(context.Background(), 999)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if settings != nil {
		t.Fatal("expected settings to be nil")
	}
}

func TestUpsert_Insert_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	settings := &repository.UserSettings{
		UsuarioID:            1,
		IdiomaPadraoTraducao: "en",
		AutoTraduzir:         true,
		TemaInterface:        "light",
		NivelProficiencia:    "beginner",
		MinutosDiarios:       10,
		CardsDiarios:         5,
		OnboardingCompleto:   true,
		Config:               map[string]any{"notification": true},
	}

	// 1. Check if exists => returns Empty
	mock.ExpectQuery("SELECT id FROM preferencias_usuario WHERE usuario_id = \\$1").
		WithArgs(settings.UsuarioID).
		WillReturnRows(pgxmock.NewRows([]string{"id"}))

	// 2. Perform Insert
	mock.ExpectQuery("INSERT INTO preferencias_usuario").
		WithArgs(
			settings.UsuarioID, settings.IdiomaPadraoTraducao, settings.AutoTraduzir,
			settings.TemaInterface, settings.NivelProficiencia, settings.MinutosDiarios,
			settings.CardsDiarios, settings.OnboardingCompleto, pgxmock.AnyArg(),
		).
		WillReturnRows(pgxmock.NewRows([]string{"id"}).AddRow(100))

	err := repo.Upsert(context.Background(), settings)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if settings.ID != 100 {
		t.Errorf("expected updated ID to be 100, got %d", settings.ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestUpsert_Update_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	settings := &repository.UserSettings{
		UsuarioID:            1,
		IdiomaPadraoTraducao: "en",
		AutoTraduzir:         true,
		TemaInterface:        "light",
		NivelProficiencia:    "beginner",
		MinutosDiarios:       10,
		CardsDiarios:         5,
		OnboardingCompleto:   true,
		Config:               map[string]any{"notification": true},
	}

	// 1. Check if exists => returns ID 55
	mock.ExpectQuery("SELECT id FROM preferencias_usuario WHERE usuario_id = \\$1").
		WithArgs(settings.UsuarioID).
		WillReturnRows(pgxmock.NewRows([]string{"id"}).AddRow(55))

	// 2. Perform Update
	mock.ExpectExec("UPDATE preferencias_usuario SET").
		WithArgs(
			settings.IdiomaPadraoTraducao, settings.AutoTraduzir, settings.TemaInterface,
			settings.NivelProficiencia, settings.MinutosDiarios, settings.CardsDiarios,
			settings.OnboardingCompleto, pgxmock.AnyArg(), 55,
		).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err := repo.Upsert(context.Background(), settings)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if settings.ID != 55 {
		t.Errorf("expected ID to be updated to 55, got %d", settings.ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestUpdateUserLanguages_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectExec("UPDATE usuarios SET idioma_origem_id = \\$1, idioma_aprendizado_id = \\$2 WHERE id = \\$3").
		WithArgs(1, 2, 42).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err := repo.UpdateUserLanguages(context.Background(), 42, 1, 2)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestUpdateConfig_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	updates := map[string]interface{}{
		"theme": "dark",
		"font":  14,
	}

	mock.ExpectExec("UPDATE preferencias_usuario SET config = COALESCE\\(config, '\\{\\}'::jsonb\\) \\|\\| \\$1::jsonb WHERE usuario_id = \\$2").
		WithArgs(pgxmock.AnyArg(), 42).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err := repo.UpdateConfig(context.Background(), 42, updates)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}
