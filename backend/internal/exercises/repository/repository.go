package repository

import (
	"context"
	"encoding/json"

	"extension-backend/internal/exercises"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetByID busca um exercício pelo ID
func (r *Repository) GetByID(ctx context.Context, id int) (*exercises.Exercicio, error) {
	query := `
		SELECT id, usuario_id, tipo_componente, dados_exercicio, nivel, tags, criado_em
		FROM exercicios
		WHERE id = $1
	`

	var ex exercises.Exercicio
	var dadosJSON []byte

	err := r.db.QueryRow(ctx, query, id).Scan(
		&ex.ID, &ex.UsuarioID, &ex.TipoComponente,
		&dadosJSON, &ex.Nivel, &ex.Tags, &ex.CriadoEm,
	)
	if err != nil {
		return nil, err
	}

	if dadosJSON != nil {
		json.Unmarshal(dadosJSON, &ex.DadosExercicio)
	}

	return &ex, nil
}

// GetByType busca exercícios por tipo (globais + do usuário)
func (r *Repository) GetByType(ctx context.Context, tipo string, userID int) ([]exercises.Exercicio, error) {
	query := `
		SELECT id, usuario_id, tipo_componente, dados_exercicio, nivel, tags, criado_em
		FROM exercicios
		WHERE tipo_componente = $1 
		  AND (usuario_id IS NULL OR usuario_id = $2)
		ORDER BY nivel ASC
	`

	rows, err := r.db.Query(ctx, query, tipo, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanExercicios(rows)
}

// GetAllForUser busca todos os exercícios (globais + do usuário)
func (r *Repository) GetAllForUser(ctx context.Context, userID int) ([]exercises.Exercicio, error) {
	query := `
		SELECT id, usuario_id, tipo_componente, dados_exercicio, nivel, tags, criado_em
		FROM exercicios
		WHERE usuario_id IS NULL OR usuario_id = $1
		ORDER BY tipo_componente, nivel ASC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanExercicios(rows)
}

// scanExercicios faz scan de múltiplas rows para []Exercicio
func scanExercicios(rows interface {
	Next() bool
	Scan(dest ...interface{}) error
	Err() error
}) ([]exercises.Exercicio, error) {
	var list []exercises.Exercicio

	for rows.Next() {
		var ex exercises.Exercicio
		var dadosJSON []byte

		err := rows.Scan(
			&ex.ID, &ex.UsuarioID, &ex.TipoComponente,
			&dadosJSON, &ex.Nivel, &ex.Tags, &ex.CriadoEm,
		)
		if err != nil {
			return nil, err
		}

		if dadosJSON != nil {
			json.Unmarshal(dadosJSON, &ex.DadosExercicio)
		}

		list = append(list, ex)
	}

	return list, rows.Err()
}
