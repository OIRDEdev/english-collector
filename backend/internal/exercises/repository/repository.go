package repository

import (
	"context"
	"encoding/json"

	"extension-backend/internal/exercises"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DBTX interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type Repository struct {
	db DBTX
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func NewWithDB(db DBTX) *Repository {
	return &Repository{db: db}
}

// ── Tipos ──────────────────────────────────────────────────────

// ListTipos retorna todos os tipos de exercício
func (r *Repository) ListTipos(ctx context.Context) ([]exercises.TipoExercicio, error) {
	query := `
		SELECT id, nome, COALESCE(descricao, ''), criado_em
		FROM tipos_exercicio
		ORDER BY id
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []exercises.TipoExercicio
	for rows.Next() {
		var t exercises.TipoExercicio
		if err := rows.Scan(&t.ID, &t.Nome, &t.Descricao, &t.CriadoEm); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, rows.Err()
}

// ── Catálogo ───────────────────────────────────────────────────

// ListCatalogo retorna todos os itens do catálogo com o nome do tipo
func (r *Repository) ListCatalogo(ctx context.Context) ([]exercises.CatalogoItem, error) {
	query := `
		SELECT c.id, c.nome, COALESCE(c.descricao, ''), c.tipo_id, t.nome, c.ativo
		FROM exercicios_catalogo c
		JOIN tipos_exercicio t ON t.id = c.tipo_id
		WHERE c.ativo = true
		ORDER BY c.tipo_id, c.nome
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []exercises.CatalogoItem
	for rows.Next() {
		var item exercises.CatalogoItem
		if err := rows.Scan(&item.ID, &item.Nome, &item.Descricao, &item.TipoID, &item.TipoNome, &item.Ativo); err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}

// GetCatalogoByTipo retorna catálogos filtrados por tipo
func (r *Repository) GetCatalogoByTipo(ctx context.Context, tipoID int) ([]exercises.CatalogoItem, error) {
	query := `
		SELECT c.id, c.nome, COALESCE(c.descricao, ''), c.tipo_id, t.nome, c.ativo
		FROM exercicios_catalogo c
		JOIN tipos_exercicio t ON t.id = c.tipo_id
		WHERE c.tipo_id = $1 AND c.ativo = true
		ORDER BY c.nome
	`

	rows, err := r.db.Query(ctx, query, tipoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []exercises.CatalogoItem
	for rows.Next() {
		var item exercises.CatalogoItem
		if err := rows.Scan(&item.ID, &item.Nome, &item.Descricao, &item.TipoID, &item.TipoNome, &item.Ativo); err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}

// ── Exercícios ─────────────────────────────────────────────────

// GetByID busca um exercício pelo ID
func (r *Repository) GetByID(ctx context.Context, id int) (*exercises.Exercicio, error) {
	query := `
		SELECT id, usuario_id, catalogo_id, dados_exercicio, nivel, criado_em
		FROM exercicios
		WHERE id = $1
	`

	var ex exercises.Exercicio
	var dadosJSON []byte

	err := r.db.QueryRow(ctx, query, id).Scan(
		&ex.ID, &ex.UsuarioID, &ex.CatalogoID,
		&dadosJSON, &ex.Nivel, &ex.CriadoEm,
	)
	if err != nil {
		return nil, err
	}

	if dadosJSON != nil {
		json.Unmarshal(dadosJSON, &ex.DadosExercicio)
	}

	return &ex, nil
}

// GetByCatalogoID busca exercícios de um catálogo, limitando a N
func (r *Repository) GetByCatalogoID(ctx context.Context, catalogoID int, limit int) ([]exercises.Exercicio, error) {
	query := `
		SELECT id, usuario_id, catalogo_id, dados_exercicio, nivel, criado_em
		FROM exercicios
		WHERE catalogo_id = $1
		ORDER BY nivel ASC
		LIMIT $2
	`

	rows, err := r.db.Query(ctx, query, catalogoID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []exercises.Exercicio
	for rows.Next() {
		var ex exercises.Exercicio
		var dadosJSON []byte

		if err := rows.Scan(
			&ex.ID, &ex.UsuarioID, &ex.CatalogoID,
			&dadosJSON, &ex.Nivel, &ex.CriadoEm,
		); err != nil {
			return nil, err
		}

		if dadosJSON != nil {
			json.Unmarshal(dadosJSON, &ex.DadosExercicio)
		}

		list = append(list, ex)
	}
	return list, rows.Err()
}
