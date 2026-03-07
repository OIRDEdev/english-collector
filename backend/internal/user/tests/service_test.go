package user_test

import (
	"context"
	"testing"
	"time"

	"extension-backend/internal/shared"
	"extension-backend/internal/user"

	"github.com/pashagolub/pgxmock/v4"
)

func setupServiceMock(t *testing.T) (pgxmock.PgxPoolIface, *user.Service) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	userRepo := user.NewRepository(mock)
	tokenRepo := user.NewRefreshTokenRepository(mock)
	tokenService := user.NewTokenService()

	svc := user.NewService(userRepo, tokenRepo, tokenService)

	return mock, svc
}

func TestService_Create_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	input := user.CreateInput{
		Nome:  "John Doe",
		Email: "john@example.com",
		Senha: "password123",
	}

	now := time.Now()
	// Create is called, HashPassword inside service happens first.
	// Then Insert into usuarios. We use .AnyArg() for SenhaHash and TokenExtensao as they are generated dynamically.
	mock.ExpectQuery("INSERT INTO usuarios").
		WithArgs(input.Nome, input.Email, pgxmock.AnyArg(), pgxmock.AnyArg()).
		WillReturnRows(pgxmock.NewRows([]string{"id", "criado_em"}).AddRow(1, now))

	u, err := svc.Create(context.Background(), input)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if u.ID != 1 {
		t.Errorf("expected ID 1, got %d", u.ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestService_Register_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	input := user.RegisterInput{
		Nome:  "Alice",
		Email: "alice@example.com",
		Senha: "password123",
	}

	now := time.Now()

	// 1. Check existing email (should return not found so registration proceeds)
	mock.ExpectQuery("SELECT (.+) FROM usuarios WHERE email = \\$1").
		WithArgs(input.Email).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "nome", "email", "senha_hash", "token_extensao", "idioma_origem_id", "idioma_aprendizado_id", "criado_em",
		}))

	// 2. Create the user
	mock.ExpectQuery("INSERT INTO usuarios").
		WithArgs(input.Nome, input.Email, pgxmock.AnyArg(), pgxmock.AnyArg()).
		WillReturnRows(pgxmock.NewRows([]string{"id", "criado_em"}).AddRow(1, now))

	// 3. Insert refresh token
	mock.ExpectExec("INSERT INTO refresh_tokens").
		WithArgs(1, pgxmock.AnyArg(), pgxmock.AnyArg(), "127.0.0.1", "test-agent").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	tokens, err := svc.Register(context.Background(), input, "127.0.0.1", "test-agent")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if tokens.AccessToken == "" || tokens.RefreshToken == "" {
		t.Errorf("expected generated tokens, got empty")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestService_Register_EmailExists(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	input := user.RegisterInput{
		Nome:  "Alice",
		Email: "alice@example.com",
		Senha: "password123",
	}

	now := time.Now()

	// 1. Check existing email (returns a user)
	mock.ExpectQuery("SELECT (.+) FROM usuarios WHERE email = \\$1").
		WithArgs(input.Email).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "nome", "email", "senha_hash", "token_extensao", "idioma_origem_id", "idioma_aprendizado_id", "criado_em",
		}).AddRow(1, "Alice", "alice@example.com", "hash", "token", nil, nil, now))

	_, err := svc.Register(context.Background(), input, "127.0.0.1", "test-agent")

	if err == nil {
		t.Fatal("expected error for email already registered, got nil")
	}
	if err.Error() != "email already registered" {
		t.Errorf("unexpected error message: %v", err)
	}
}

func TestService_Login_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	password := "password123"
	hash, _ := shared.HashPassword(password)
	now := time.Now()

	input := user.LoginInput{
		Email: "bob@example.com",
		Senha: password,
	}

	// 1. Get by Email
	mock.ExpectQuery("SELECT (.+) FROM usuarios WHERE email = \\$1").
		WithArgs(input.Email).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "nome", "email", "senha_hash", "token_extensao", "idioma_origem_id", "idioma_aprendizado_id", "criado_em",
		}).AddRow(1, "Bob", input.Email, hash, "token", nil, nil, now))

	// 2. Insert new refresh token
	mock.ExpectExec("INSERT INTO refresh_tokens").
		WithArgs(1, pgxmock.AnyArg(), pgxmock.AnyArg(), "127.0.0.1", "test-agent").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	tokens, err := svc.Login(context.Background(), input, "127.0.0.1", "test-agent")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if tokens.AccessToken == "" {
		t.Errorf("expected access token, got empty")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestService_Login_InvalidCredentials(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	now := time.Now()
	// Mock will return a hash of "realpassword", but user will input "wrongpassword"
	hash, _ := shared.HashPassword("realpassword")

	input := user.LoginInput{
		Email: "bob@example.com",
		Senha: "wrongpassword",
	}

	// Get by Email returns the user
	mock.ExpectQuery("SELECT (.+) FROM usuarios WHERE email = \\$1").
		WithArgs(input.Email).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "nome", "email", "senha_hash", "token_extensao", "idioma_origem_id", "idioma_aprendizado_id", "criado_em",
		}).AddRow(1, "Bob", input.Email, hash, "token", nil, nil, now))

	_, err := svc.Login(context.Background(), input, "127.0.0.1", "test-agent")

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != "invalid credentials" {
		t.Errorf("unexpected error message: %v", err)
	}
}

func TestService_RefreshTokens_Success(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	refreshToken := "valid_refresh_token"
	ip := "127.0.0.1"
	userAgent := "test-agent"
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour)

	// 1. Validate refresh token
	mock.ExpectQuery("SELECT (.+) FROM refresh_tokens WHERE token = \\$1 AND expira_em > NOW\\(\\)").
		WithArgs(refreshToken).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "token", "expira_em", "criado_em", "revogado", "ip", "user_agent",
		}).AddRow(1, 42, refreshToken, expiresAt, now, false, ip, userAgent))

	// 2. Get User By ID
	mock.ExpectQuery("SELECT (.+) FROM usuarios WHERE id = \\$1").
		WithArgs(42).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "nome", "email", "senha_hash", "token_extensao", "idioma_origem_id", "idioma_aprendizado_id", "criado_em",
		}).AddRow(42, "Charlie", "charlie@test.com", "hash", "token", nil, nil, now))

	// 3. Revoke old token
	mock.ExpectExec("UPDATE refresh_tokens SET revogado = TRUE WHERE id = \\$1").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// 4. Create new token
	mock.ExpectExec("INSERT INTO refresh_tokens").
		WithArgs(42, pgxmock.AnyArg(), pgxmock.AnyArg(), ip, userAgent).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	tokens, err := svc.RefreshTokens(context.Background(), refreshToken, ip, userAgent)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if tokens.AccessToken == "" {
		t.Errorf("expected access token")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestService_RefreshTokens_SuspiciousActivity(t *testing.T) {
	mock, svc := setupServiceMock(t)
	defer mock.Close()

	refreshToken := "stolen_token"
	originalIP := "127.0.0.1"
	hackerIP := "9.9.9.9"
	userAgent := "test-agent"
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour)

	// 1. Validate refresh token (was requested from originalIP, but now used by hackerIP)
	mock.ExpectQuery("SELECT (.+) FROM refresh_tokens WHERE token = \\$1 AND expira_em > NOW\\(\\)").
		WithArgs(refreshToken).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "token", "expira_em", "criado_em", "revogado", "ip", "user_agent",
		}).AddRow(1, 42, refreshToken, expiresAt, now, false, originalIP, userAgent))

	// 2. Expect the token to be revoked immediately because IP doesn't match
	mock.ExpectExec("UPDATE refresh_tokens SET revogado = TRUE WHERE id = \\$1").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	_, err := svc.RefreshTokens(context.Background(), refreshToken, hackerIP, userAgent)

	if err == nil {
		t.Fatal("expected suspicious activity error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}
