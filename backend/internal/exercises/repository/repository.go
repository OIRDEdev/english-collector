package repository

import (
	"context"
	"encoding/json"

	"errors"
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
		SELECT c.id, c.nome, COALESCE(c.descricao, ''), c.tipo_id, t.nome, c.ativo, c.img
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
		if err := rows.Scan(&item.ID, &item.Nome, &item.Descricao, &item.TipoID, &item.TipoNome, &item.Ativo, &item.Img); err != nil {
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

// GetByCatalogoAndUserLanguages busca exercícios filtrando pelos idiomas nativo e alvo do usuário,
// incluindo exercícios globais (usuario_id IS NULL) e do próprio usuário,
// e omitindo os que ele já viu na tabela exercicios_visualizados.
func (r *Repository) GetByCatalogoAndUserLanguages(ctx context.Context, catalogoID int, userID int, limit int) ([]exercises.Exercicio, error) {
	query := `
		SELECT e.id, e.usuario_id, e.catalogo_id, e.dados_exercicio, e.nivel, e.criado_em
		FROM exercicios e
		JOIN usuarios u ON u.id = $2
		LEFT JOIN exercicios_visualizados ev ON ev.exercicio_id = e.id AND ev.usuario_id = $2
		WHERE e.catalogo_id = $1
		  AND e.idioma_id_origem = u.idioma_origem_id
		  AND e.idioma_id = u.idioma_aprendizado_id
		  AND (e.usuario_id = $2 OR e.usuario_id IS NULL)
		  AND ev.exercicio_id IS NULL
		ORDER BY RANDOM()
		LIMIT $3
	`

	rows, err := r.db.Query(ctx, query, catalogoID, userID, limit)
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
	if len(list) == 0 {
		return nil, errors.New("no exercises found")
	}
	return list, rows.Err()
}

// MarkExerciseAsViewed insere o exercício na tabela de já visualizados para o usuário
func (r *Repository) MarkExerciseAsViewed(ctx context.Context, userID int, exercicioID int) error {
	query := `
		INSERT INTO exercicios_visualizados (usuario_id, exercicio_id) 
		VALUES ($1, $2) 
		ON CONFLICT (usuario_id, exercicio_id) DO NOTHING
	`
	_, err := r.db.Exec(ctx, query, userID, exercicioID)
	return err
}

// ListHistorias retorna exercícios de história filtrados por idiomas do usuário e excluindo já visualizados
func (r *Repository) ListHistorias(ctx context.Context, userID int, limit int) ([]exercises.Exercicio, error) {
	query := `
		SELECT e.id, e.usuario_id, e.catalogo_id, e.dados_exercicio, e.nivel, e.criado_em
		FROM exercicios e
		JOIN usuarios u ON u.id = $1
		JOIN exercicios_catalogo c ON c.id = e.catalogo_id AND c.nome = 'historia'
		LEFT JOIN exercicios_visualizados ev ON ev.exercicio_id = e.id AND ev.usuario_id = $1
		WHERE e.idioma_id_origem = u.idioma_origem_id
		  AND e.idioma_id = u.idioma_aprendizado_id
		  AND (e.usuario_id = $1 OR e.usuario_id IS NULL)
		  AND ev.exercicio_id IS NULL
		ORDER BY e.criado_em DESC
		LIMIT $2
	`

	rows, err := r.db.Query(ctx, query, userID, limit)
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
