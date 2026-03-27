package user_test

import (
	"context"
	"testing"
	"time"

	"extension-backend/internal/user"

	"github.com/pashagolub/pgxmock/v4"
)

// setupMock cria um mock para a conexão do banco e inicializa o Repository.
func setupMock(t *testing.T) (pgxmock.PgxPoolIface, *user.Repository) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	repo := user.NewRepository(mock)
	return mock, repo
}

func TestRepository_Create_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	u := &user.User{
		Nome:          "Test User",
		Email:         "test@test.com",
		SenhaHash:     "hashed_password",
		TokenExtensao: "some_token",
	}

	mock.ExpectQuery("INSERT INTO usuarios").
		WithArgs(u.Nome, u.Email, u.SenhaHash, u.TokenExtensao).
		WillReturnRows(pgxmock.NewRows([]string{"id", "criado_em"}).AddRow(1, now))

	err := repo.Create(context.Background(), u)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if u.ID != 1 {
		t.Errorf("expected ID 1, got %d", u.ID)
	}
	if u.CriadoEm != now {
		t.Errorf("expected time %v, got %v", now, u.CriadoEm)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestRepository_GetByID_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()
	langID1 := 1
	langID2 := 2

	mock.ExpectQuery(`SELECT u.id, u.nome, u.email, u.senha_hash, u.token_extensao, 
		       u.idioma_origem_id, io.codigo as idioma_origem_codigo,
		       u.idioma_aprendizado_id, ia.codigo as idioma_aprendizado_codigo, 
		       u.criado_em
		FROM usuarios u
		LEFT JOIN idiomas io ON u.idioma_origem_id = io.id
		LEFT JOIN idiomas ia ON u.idioma_aprendizado_id = ia.id
		WHERE u.id = \$1`).
		WithArgs(1).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "nome", "email", "senha_hash", "token_extensao", "idioma_origem_id", "idioma_origem_codigo", "idioma_aprendizado_id", "idioma_aprendizado_codigo", "criado_em",
		}).AddRow(1, "Test", "test@test.com", "hash", "token", &langID1, "pt", &langID2, "en", now))

	u, err := repo.GetByID(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if u.ID != 1 || u.Email != "test@test.com" || u.IdiomaOrigemID == nil || *u.IdiomaOrigemID != langID1 {
		t.Errorf("unexpected user data: %+v", u)
	}
}

func TestRepository_GetByID_NotFound(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectQuery("SELECT (.+) FROM usuarios WHERE id = \\$1").
		WithArgs(999).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "nome", "email", "senha_hash", "token_extensao", "idioma_origem_id", "idioma_aprendizado_id", "criado_em",
		})) // Empty rows

	u, err := repo.GetByID(context.Background(), 999)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if u != nil {
		t.Fatal("expected user to be nil")
	}
}

func TestRepository_GetByEmail_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()

	mock.ExpectQuery("SELECT (.+) FROM usuarios u").
		WithArgs("test@test.com").
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "nome", "email", "senha_hash", "token_extensao", "idioma_origem_id", "idioma_origem_codigo", "idioma_aprendizado_id", "idioma_aprendizado_codigo", "criado_em",
		}).AddRow(1, "Test", "test@test.com", "hash", "token", nil, "", nil, "", now))

	u, err := repo.GetByEmail(context.Background(), "test@test.com")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if u.ID != 1 || u.Email != "test@test.com" {
		t.Errorf("unexpected user data: %+v", u)
	}
}

func TestRepository_GetAll_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	now := time.Now()

	mock.ExpectQuery("SELECT (.+) FROM usuarios ORDER BY criado_em DESC").
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "nome", "email", "token_extensao", "idioma_origem_id", "idioma_aprendizado_id", "criado_em",
		}).
			AddRow(1, "User 1", "u1@test.com", "t1", nil, nil, now).
			AddRow(2, "User 2", "u2@test.com", "t2", nil, nil, now))

	users, err := repo.GetAll(context.Background())

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(users) != 2 {
		t.Fatalf("expected 2 users, got %d", len(users))
	}
	if users[0].ID != 1 || users[1].ID != 2 {
		t.Errorf("unexpected user IDs")
	}
}

func TestRepository_Update_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	u := &user.User{
		ID:    1,
		Nome:  "Updated Name",
		Email: "updated@test.com",
	}

	mock.ExpectExec("UPDATE usuarios SET nome = \\$1, email = \\$2 WHERE id = \\$3").
		WithArgs(u.Nome, u.Email, u.ID).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err := repo.Update(context.Background(), u)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestRepository_Delete_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectExec("DELETE FROM usuarios WHERE id = \\$1").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("DELETE", 1))

	err := repo.Delete(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestRepository_UpdateExtensionToken_Success(t *testing.T) {
	mock, repo := setupMock(t)
	defer mock.Close()

	mock.ExpectExec("UPDATE usuarios SET token_extensao = \\$1 WHERE id = \\$2").
		WithArgs("new_token", 1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err := repo.UpdateExtensionToken(context.Background(), 1, "new_token")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}
