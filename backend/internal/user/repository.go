package user

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, u *User) error {
	query := `
		INSERT INTO usuarios (nome, email, senha_hash, token_extensao)
		VALUES ($1, $2, $3, $4)
		RETURNING id, criado_em
	`
	return r.db.QueryRow(ctx, query, u.Nome, u.Email, u.SenhaHash, u.TokenExtensao).
		Scan(&u.ID, &u.CriadoEm)
}

func (r *Repository) GetByID(ctx context.Context, id int) (*User, error) {
	query := `
		SELECT id, nome, email, senha_hash, token_extensao, criado_em
		FROM usuarios WHERE id = $1
	`
	var u User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Nome, &u.Email, &u.SenhaHash, &u.TokenExtensao, &u.CriadoEm,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, nome, email, senha_hash, token_extensao, criado_em
		FROM usuarios WHERE email = $1
	`
	var u User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Nome, &u.Email, &u.SenhaHash, &u.TokenExtensao, &u.CriadoEm,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func (r *Repository) GetByExtensionToken(ctx context.Context, token string) (*User, error) {
	query := `
		SELECT id, nome, email, senha_hash, token_extensao, criado_em
		FROM usuarios WHERE token_extensao = $1
	`
	var u User
	err := r.db.QueryRow(ctx, query, token).Scan(
		&u.ID, &u.Nome, &u.Email, &u.SenhaHash, &u.TokenExtensao, &u.CriadoEm,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func (r *Repository) GetAll(ctx context.Context) ([]User, error) {
	query := `SELECT id, nome, email, token_extensao, criado_em FROM usuarios ORDER BY criado_em DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Nome, &u.Email, &u.TokenExtensao, &u.CriadoEm); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *Repository) Update(ctx context.Context, u *User) error {
	query := `UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, u.Nome, u.Email, u.ID)
	return err
}

func (r *Repository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM usuarios WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *Repository) UpdateExtensionToken(ctx context.Context, id int, token string) error {
	query := `UPDATE usuarios SET token_extensao = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, token, id)
	return err
}
