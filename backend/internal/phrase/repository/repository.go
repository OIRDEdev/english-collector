package repository

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository gerencia todas as operações de banco para frases
type Repository struct {
	db *pgxpool.Pool
}

// New cria uma nova instância do repositório
func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}
