package user

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type DBTX interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type Repository struct {
	db DBTX
}

func NewRepository(db DBTX) *Repository {
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
		SELECT u.id, u.nome, u.email, u.senha_hash, u.token_extensao, 
		       u.idioma_origem_id, io.codigo as idioma_origem_codigo,
		       u.idioma_aprendizado_id, ia.codigo as idioma_aprendizado_codigo, 
		       u.criado_em
		FROM usuarios u
		LEFT JOIN idiomas io ON u.idioma_origem_id = io.id
		LEFT JOIN idiomas ia ON u.idioma_aprendizado_id = ia.id
		WHERE u.id = $1
	`
	var u User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Nome, &u.Email, &u.SenhaHash, &u.TokenExtensao,
		&u.IdiomaOrigemID, &u.IdiomaOrigemCodigo,
		&u.IdiomaAprendizadoID, &u.IdiomaAprendizadoCodigo,
		&u.CriadoEm,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT u.id, u.nome, u.email, u.senha_hash, u.token_extensao, 
		       u.idioma_origem_id, io.codigo as idioma_origem_codigo,
		       u.idioma_aprendizado_id, ia.codigo as idioma_aprendizado_codigo, 
		       u.criado_em
		FROM usuarios u
		LEFT JOIN idiomas io ON u.idioma_origem_id = io.id
		LEFT JOIN idiomas ia ON u.idioma_aprendizado_id = ia.id
		WHERE u.email = $1
	`
	var u User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Nome, &u.Email, &u.SenhaHash, &u.TokenExtensao,
		&u.IdiomaOrigemID, &u.IdiomaOrigemCodigo,
		&u.IdiomaAprendizadoID, &u.IdiomaAprendizadoCodigo,
		&u.CriadoEm,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func (r *Repository) GetByExtensionToken(ctx context.Context, token string) (*User, error) {
	query := `
		SELECT u.id, u.nome, u.email, u.senha_hash, u.token_extensao, 
		       u.idioma_origem_id, io.codigo as idioma_origem_codigo,
		       u.idioma_aprendizado_id, ia.codigo as idioma_aprendizado_codigo, 
		       u.criado_em
		FROM usuarios u
		LEFT JOIN idiomas io ON u.idioma_origem_id = io.id
		LEFT JOIN idiomas ia ON u.idioma_aprendizado_id = ia.id
		WHERE u.token_extensao = $1
	`
	var u User
	err := r.db.QueryRow(ctx, query, token).Scan(
		&u.ID, &u.Nome, &u.Email, &u.SenhaHash, &u.TokenExtensao,
		&u.IdiomaOrigemID, &u.IdiomaOrigemCodigo,
		&u.IdiomaAprendizadoID, &u.IdiomaAprendizadoCodigo,
		&u.CriadoEm,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func (r *Repository) GetAll(ctx context.Context) ([]User, error) {
	query := `SELECT id, nome, email, token_extensao, idioma_origem_id, idioma_aprendizado_id, criado_em FROM usuarios ORDER BY criado_em DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Nome, &u.Email, &u.TokenExtensao, &u.IdiomaOrigemID, &u.IdiomaAprendizadoID, &u.CriadoEm); err != nil {
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
