package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DBTX interface mínima para operações de banco
// Implementada por *pgxpool.Pool e pgxmock
type DBTX interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

// Repository gerencia todas as operações de banco para frases
type Repository struct {
	db DBTX
}

// New cria uma nova instância do repositório
func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// NewWithDB cria repository com interface genérica (para testes)
func NewWithDB(db DBTX) *Repository {
	return &Repository{db: db}
}
