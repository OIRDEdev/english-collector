package user

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type RefreshTokenRepository struct {
	db *pgxpool.Pool
}

func NewRefreshTokenRepository(db *pgxpool.Pool) *RefreshTokenRepository {
	return &RefreshTokenRepository{db: db}
}

func (r *RefreshTokenRepository) Create(ctx context.Context, userID int, token string) error {
	query := `
		INSERT INTO refresh_tokens (usuario_id, token, expira_em)
		VALUES ($1, $2, $3)
	`
	expiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days
	_, err := r.db.Exec(ctx, query, userID, token, expiresAt)
	return err
}

func (r *RefreshTokenRepository) GetByToken(ctx context.Context, token string) (*RefreshToken, error) {
	query := `
		SELECT id, usuario_id, token, expira_em, criado_em, revogado
		FROM refresh_tokens WHERE token = $1 AND expira_em > NOW()
	`
	var rt RefreshToken
	err := r.db.QueryRow(ctx, query, token).Scan(
		&rt.ID, &rt.UsuarioID, &rt.Token, &rt.ExpiraEm, &rt.CriadoEm, &rt.Revogado,
	)
	if err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *RefreshTokenRepository) Revoke(ctx context.Context, id int) error {
	query := `UPDATE refresh_tokens SET revogado = TRUE WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *RefreshTokenRepository) RevokeAllForUser(ctx context.Context, userID int) error {
	query := `UPDATE refresh_tokens SET revogado = TRUE WHERE usuario_id = $1`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}

func (r *RefreshTokenRepository) CleanExpired(ctx context.Context) error {
	query := `DELETE FROM refresh_tokens WHERE expira_em < NOW() OR revogado = TRUE`
	_, err := r.db.Exec(ctx, query)
	return err
}
