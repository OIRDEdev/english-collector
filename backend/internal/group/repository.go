package group

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

func (r *Repository) Create(ctx context.Context, g *Group) error {
	query := `
		INSERT INTO grupos (usuario_id, nome_grupo, descricao, cor_etiqueta)
		VALUES ($1, $2, $3, $4)
		RETURNING id, criado_em
	`
	return r.db.QueryRow(ctx, query, g.UsuarioID, g.NomeGrupo, g.Descricao, g.CorEtiqueta).
		Scan(&g.ID, &g.CriadoEm)
}

func (r *Repository) GetByID(ctx context.Context, id int) (*Group, error) {
	query := `
		SELECT id, usuario_id, nome_grupo, descricao, cor_etiqueta, criado_em
		FROM grupos WHERE id = $1
	`
	var g Group
	err := r.db.QueryRow(ctx, query, id).Scan(
		&g.ID, &g.UsuarioID, &g.NomeGrupo, &g.Descricao, &g.CorEtiqueta, &g.CriadoEm,
	)
	if err != nil {
		return nil, fmt.Errorf("group not found: %w", err)
	}
	return &g, nil
}

func (r *Repository) GetByUserID(ctx context.Context, userID int) ([]Group, error) {
	query := `
		SELECT id, usuario_id, nome_grupo, descricao, cor_etiqueta, criado_em
		FROM grupos WHERE usuario_id = $1 ORDER BY criado_em DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []Group
	for rows.Next() {
		var g Group
		if err := rows.Scan(&g.ID, &g.UsuarioID, &g.NomeGrupo, &g.Descricao, &g.CorEtiqueta, &g.CriadoEm); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, nil
}

func (r *Repository) GetAll(ctx context.Context) ([]Group, error) {
	query := `
		SELECT id, usuario_id, nome_grupo, descricao, cor_etiqueta, criado_em
		FROM grupos ORDER BY criado_em DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []Group
	for rows.Next() {
		var g Group
		if err := rows.Scan(&g.ID, &g.UsuarioID, &g.NomeGrupo, &g.Descricao, &g.CorEtiqueta, &g.CriadoEm); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, nil
}

func (r *Repository) Update(ctx context.Context, g *Group) error {
	query := `UPDATE grupos SET nome_grupo = $1, descricao = $2, cor_etiqueta = $3 WHERE id = $4`
	_, err := r.db.Exec(ctx, query, g.NomeGrupo, g.Descricao, g.CorEtiqueta, g.ID)
	return err
}

func (r *Repository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM grupos WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *Repository) AddPhraseToGroup(ctx context.Context, phraseID, groupID int) error {
	query := `INSERT INTO frase_grupos (frase_id, grupo_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(ctx, query, phraseID, groupID)
	return err
}

func (r *Repository) RemovePhraseFromGroup(ctx context.Context, phraseID, groupID int) error {
	query := `DELETE FROM frase_grupos WHERE frase_id = $1 AND grupo_id = $2`
	_, err := r.db.Exec(ctx, query, phraseID, groupID)
	return err
}

func (r *Repository) GetPhraseGroups(ctx context.Context, phraseID int) ([]Group, error) {
	query := `
		SELECT g.id, g.usuario_id, g.nome_grupo, g.descricao, g.cor_etiqueta, g.criado_em
		FROM grupos g
		INNER JOIN frase_grupos fg ON g.id = fg.grupo_id
		WHERE fg.frase_id = $1
	`
	rows, err := r.db.Query(ctx, query, phraseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []Group
	for rows.Next() {
		var g Group
		if err := rows.Scan(&g.ID, &g.UsuarioID, &g.NomeGrupo, &g.Descricao, &g.CorEtiqueta, &g.CriadoEm); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, nil
}
