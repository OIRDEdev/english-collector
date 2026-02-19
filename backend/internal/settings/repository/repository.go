package repository

import "github.com/jackc/pgx/v5/pgxpool"

// Repository gerencia a persistência de preferências do usuário
type Repository struct {
	db *pgxpool.Pool
}

// New cria uma nova instância do Repository
func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}
