package settings_test

import (
	"context"
	"testing"

	"extension-backend/internal/settings"
	"extension-backend/internal/settings/repository"

	"github.com/pashagolub/pgxmock/v4"
)

func setupServiceMock(t *testing.T) (pgxmock.PgxPoolIface, *settings.Service) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	repo := repository.New(mock)
	svc := settings.NewService(repo)

	return mock, svc
}

// ptr is a helper to get pointers for struct fields
func ptr[T any](v T) *T {
	return &v
}

func TestService_GetSettings_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	// Given a user with existing settings
	mock.ExpectQuery("SELECT (.+) FROM preferencias_usuario WHERE usuario_id = \\$1").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "idioma_padrao_traducao", "auto_traduzir", "tema_interface",
			"nivel_proficiencia", "minutos_diarios", "cards_diarios", "onboarding_completo", "config",
		}).AddRow(
			10, 1, "es", true, "light",
			"beginner", 20, 15, true, nil,
		))

	s, err := svc.GetSettings(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if s.IdiomaPadraoTraducao != "es" || s.MinutosDiarios != 20 {
		t.Errorf("unexpected settings returned: %+v", s)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestService_GetSettings_ReturnsDefaultsIfNotFound(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	// DB returns no rows
	mock.ExpectQuery("SELECT (.+) FROM preferencias_usuario WHERE usuario_id = \\$1").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "idioma_padrao_traducao", "auto_traduzir", "tema_interface",
			"nivel_proficiencia", "minutos_diarios", "cards_diarios", "onboarding_completo", "config",
		}))

	s, err := svc.GetSettings(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	// Verify defaults
	if s.IdiomaPadraoTraducao != "pt-BR" || s.AutoTraduzir != false || s.TemaInterface != "dark" || s.MinutosDiarios != 15 || s.OnboardingCompleto != false {
		t.Errorf("did not return expected defaults, got: %+v", s)
	}
}

func TestService_UpdateSettings_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	input := repository.UpdateSettingsInput{
		UserID:            1,
		TemaInterface:     ptr("light"),
		MinutosDiarios:    ptr(40),
		NativeLangID:      ptr(10), // Will trigger UpdateUserLanguages
		TargetLangID:      ptr(11), // Will trigger UpdateUserLanguages
		Config:            map[string]any{"color": "blue"},
	}

	// 1. Get current settings returns existing row (ID: 5)
	mock.ExpectQuery("SELECT (.+) FROM preferencias_usuario WHERE usuario_id = \\$1").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "idioma_padrao_traducao", "auto_traduzir", "tema_interface",
			"nivel_proficiencia", "minutos_diarios", "cards_diarios", "onboarding_completo", "config",
		}).AddRow(
			5, 1, "pt-BR", false, "dark",
			"intermediate", 15, 10, true, nil,
		))

	// 2. Languages update is triggered because NativeLangID/TargetLangID were sent
	mock.ExpectExec("UPDATE usuarios SET idioma_origem_id = \\$1, idioma_aprendizado_id = \\$2 WHERE id = \\$3").
		WithArgs(*input.NativeLangID, *input.TargetLangID, 1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// 3. Upsert update check
	mock.ExpectQuery("SELECT id FROM preferencias_usuario WHERE usuario_id = \\$1").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{"id"}).AddRow(5))

	// 4. Exec Update with the patched settings
	mock.ExpectExec("UPDATE preferencias_usuario SET").
		WithArgs(
			"pt-BR", false, "light", "intermediate", 40, 10, true, pgxmock.AnyArg(), 5,
		).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	s, err := svc.UpdateSettings(context.Background(), input)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if s.TemaInterface != "light" || s.MinutosDiarios != 40 {
		t.Errorf("fields were not patched correctly")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestService_CompleteOnboarding_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	input := repository.OnboardingInput{
		UserID:       1,
		NativeLangID: 10,
		TargetLangID: 11,
		Level:        "advanced",
		DailyMinutes: 30,
		DailyCards:   20,
	}

	// 1. User languages update
	mock.ExpectExec("UPDATE usuarios SET idioma_origem_id = \\$1, idioma_aprendizado_id = \\$2 WHERE id = \\$3").
		WithArgs(input.NativeLangID, input.TargetLangID, input.UserID).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// 2. Upsert check (user does not exist in preferences yet)
	mock.ExpectQuery("SELECT id FROM preferencias_usuario WHERE usuario_id = \\$1").
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{"id"})) // Empty

	// 3. Insert new preferences
	mock.ExpectQuery("INSERT INTO preferencias_usuario").
		WithArgs(
			input.UserID, "pt-BR", false, "dark", input.Level, input.DailyMinutes, input.DailyCards, true, pgxmock.AnyArg(),
		).
		WillReturnRows(pgxmock.NewRows([]string{"id"}).AddRow(99))

	s, err := svc.CompleteOnboarding(context.Background(), input)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if s.ID != 99 || s.MinutosDiarios != 30 || s.OnboardingCompleto != true {
		t.Errorf("onboarding failed to structure settings struct properly")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}
