package user_test

import (
	"context"
	"testing"
	"time"

	"extension-backend/internal/user"

	"github.com/pashagolub/pgxmock/v4"
)

// setupMockRT cria um mock para a conexão do banco e inicializa o RefreshTokenRepository.
func setupMockRT(t *testing.T) (pgxmock.PgxPoolIface, *user.RefreshTokenRepository) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	repo := user.NewRefreshTokenRepository(mock)
	return mock, repo
}

func TestRefreshTokenRepository_Create_Success(t *testing.T) {
	mock, repo := setupMockRT(t)
	defer mock.Close()

	userID := 1
	token := "refresh_token_123"
	ip := "127.0.0.1"
	userAgent := "Mozilla/5.0"

	mock.ExpectExec("INSERT INTO refresh_tokens").
		WithArgs(userID, token, pgxmock.AnyArg(), ip, userAgent).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err := repo.Create(context.Background(), userID, token, ip, userAgent)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestRefreshTokenRepository_GetByToken_Success(t *testing.T) {
	mock, repo := setupMockRT(t)
	defer mock.Close()

	now := time.Now()
	expiresAt := now.Add(24 * time.Hour)
	token := "valid_token"

	mock.ExpectQuery("SELECT (.+) FROM refresh_tokens WHERE token = \\$1 AND expira_em > NOW\\(\\)").
		WithArgs(token).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "token", "expira_em", "criado_em", "revogado", "ip", "user_agent",
		}).AddRow(1, 1, token, expiresAt, now, false, "127.0.0.1", "curl"))

	rt, err := repo.GetByToken(context.Background(), token)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if rt.ID != 1 || rt.Token != token || rt.Revogado {
		t.Errorf("unexpected token data: %+v", rt)
	}
}

func TestRefreshTokenRepository_GetByToken_NotFoundOrExpired(t *testing.T) {
	mock, repo := setupMockRT(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM refresh_tokens WHERE token = \\$1 AND expira_em > NOW\\(\\)").
		WithArgs("expired_token").
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "usuario_id", "token", "expira_em", "criado_em", "revogado", "ip", "user_agent",
		})) // Empty rows

	rt, err := repo.GetByToken(context.Background(), "expired_token")

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if rt != nil {
		t.Fatal("expected token to be nil")
	}
}

func TestRefreshTokenRepository_Revoke_Success(t *testing.T) {
	mock, repo := setupMockRT(t)
	defer mock.Close()

	mock.ExpectExec("UPDATE refresh_tokens SET revogado = TRUE WHERE id = \\$1").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err := repo.Revoke(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestRefreshTokenRepository_RevokeAllForUser_Success(t *testing.T) {
	mock, repo := setupMockRT(t)
	defer mock.Close()

	mock.ExpectExec("UPDATE refresh_tokens SET revogado = TRUE WHERE usuario_id = \\$1").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 3))

	err := repo.RevokeAllForUser(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestRefreshTokenRepository_CleanExpired_Success(t *testing.T) {
	mock, repo := setupMockRT(t)
	defer mock.Close()

	mock.ExpectExec("DELETE FROM refresh_tokens WHERE expira_em < NOW\\(\\) OR revogado = TRUE").
		WillReturnResult(pgxmock.NewResult("DELETE", 5))

	err := repo.CleanExpired(context.Background())

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}
