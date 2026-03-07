package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// DBTX define an interface for database transactions.
type DBTX interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

// Repository gerencia a persistência de preferências do usuário
type Repository struct {
	db DBTX
}

// New cria uma nova instância do Repository
func New(db DBTX) *Repository {
	return &Repository{db: db}
}
