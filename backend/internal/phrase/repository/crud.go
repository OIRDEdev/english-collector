package repository

import (
	"context"
	"fmt"

	"extension-backend/internal/phrase"
)

// Create insere uma nova frase
func (r *Repository) Create(ctx context.Context, p *phrase.Phrase) error {
	query := `
		INSERT INTO frases (usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, capturado_em
	`
	return r.db.QueryRow(ctx, query, p.UsuarioID, p.Conteudo, p.IdiomaOrigem, p.URLOrigem, p.TituloPagina).
		Scan(&p.ID, &p.CapturadoEm)
}

// GetByID busca frase por ID
func (r *Repository) GetByID(ctx context.Context, id int) (*phrase.Phrase, error) {
	query := `
		SELECT id, usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina, capturado_em
		FROM frases WHERE id = $1
	`
	var p phrase.Phrase
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem, &p.URLOrigem, &p.TituloPagina, &p.CapturadoEm,
	)
	if err != nil {
		return nil, fmt.Errorf("phrase not found: %w", err)
	}
	return &p, nil
}

// GetByUserID lista frases de um usuário
func (r *Repository) GetByUserID(ctx context.Context, userID int) ([]phrase.Phrase, error) {
	query := `
		SELECT id, usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina, capturado_em
		FROM frases WHERE usuario_id = $1 ORDER BY capturado_em DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phrases []phrase.Phrase
	for rows.Next() {
		var p phrase.Phrase
		if err := rows.Scan(&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem, &p.URLOrigem, &p.TituloPagina, &p.CapturadoEm); err != nil {
			return nil, err
		}
		phrases = append(phrases, p)
	}
	return phrases, nil
}

// GetAll lista todas as frases
func (r *Repository) GetAll(ctx context.Context) ([]phrase.Phrase, error) {
	query := `
		SELECT id, usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina, capturado_em
		FROM frases ORDER BY capturado_em DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phrases []phrase.Phrase
	for rows.Next() {
		var p phrase.Phrase
		if err := rows.Scan(&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem, &p.URLOrigem, &p.TituloPagina, &p.CapturadoEm); err != nil {
			return nil, err
		}
		phrases = append(phrases, p)
	}
	return phrases, nil
}

// Update atualiza uma frase
func (r *Repository) Update(ctx context.Context, p *phrase.Phrase) error {
	query := `UPDATE frases SET conteudo = $1, idioma_origem = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, p.Conteudo, p.IdiomaOrigem, p.ID)
	return err
}

// Delete remove uma frase
func (r *Repository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM frases WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

// Search busca frases por termo
func (r *Repository) Search(ctx context.Context, userID int, term string) ([]phrase.Phrase, error) {
	query := `
		SELECT id, usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina, capturado_em
		FROM frases WHERE usuario_id = $1 AND to_tsvector('simple', conteudo) @@ plainto_tsquery('simple', $2)
		ORDER BY capturado_em DESC
	`
	rows, err := r.db.Query(ctx, query, userID, term)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phrases []phrase.Phrase
	for rows.Next() {
		var p phrase.Phrase
		if err := rows.Scan(&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem, &p.URLOrigem, &p.TituloPagina, &p.CapturadoEm); err != nil {
			return nil, err
		}
		phrases = append(phrases, p)
	}
	return phrases, nil
}
