package phrase

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, p *Phrase) error {
	query := `
		INSERT INTO frases (usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, capturado_em
	`
	return r.db.QueryRow(ctx, query, p.UsuarioID, p.Conteudo, p.IdiomaOrigem, p.URLOrigem, p.TituloPagina).
		Scan(&p.ID, &p.CapturadoEm)
}

func (r *Repository) GetByID(ctx context.Context, id int) (*Phrase, error) {
	query := `
		SELECT id, usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina, capturado_em
		FROM frases WHERE id = $1
	`
	var p Phrase
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem, &p.URLOrigem, &p.TituloPagina, &p.CapturadoEm,
	)
	if err != nil {
		return nil, fmt.Errorf("phrase not found: %w", err)
	}
	return &p, nil
}

func (r *Repository) GetByUserID(ctx context.Context, userID int) ([]Phrase, error) {
	query := `
		SELECT id, usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina, capturado_em
		FROM frases WHERE usuario_id = $1 ORDER BY capturado_em DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phrases []Phrase
	for rows.Next() {
		var p Phrase
		if err := rows.Scan(&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem, &p.URLOrigem, &p.TituloPagina, &p.CapturadoEm); err != nil {
			return nil, err
		}
		phrases = append(phrases, p)
	}
	return phrases, nil
}

func (r *Repository) GetAll(ctx context.Context) ([]Phrase, error) {
	query := `
		SELECT id, usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina, capturado_em
		FROM frases ORDER BY capturado_em DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phrases []Phrase
	for rows.Next() {
		var p Phrase
		if err := rows.Scan(&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem, &p.URLOrigem, &p.TituloPagina, &p.CapturadoEm); err != nil {
			return nil, err
		}
		phrases = append(phrases, p)
	}
	return phrases, nil
}

func (r *Repository) Update(ctx context.Context, p *Phrase) error {
	query := `UPDATE frases SET conteudo = $1, idioma_origem = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, p.Conteudo, p.IdiomaOrigem, p.ID)
	return err
}

func (r *Repository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM frases WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *Repository) Search(ctx context.Context, userID int, term string) ([]Phrase, error) {
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

	var phrases []Phrase
	for rows.Next() {
		var p Phrase
		if err := rows.Scan(&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem, &p.URLOrigem, &p.TituloPagina, &p.CapturadoEm); err != nil {
			return nil, err
		}
		phrases = append(phrases, p)
	}
	return phrases, nil
}

func (r *Repository) CreateDetails(ctx context.Context, d *PhraseDetails) error {
	fatias, _ := json.Marshal(d.FatiasTraducoes)
	query := `
		INSERT INTO frase_detalhes (frase_id, traducao_completa, explicacao, fatias_traducoes, modelo_ia)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, processado_em
	`
	return r.db.QueryRow(ctx, query, d.FraseID, d.TraducaoCompleta, d.Explicacao, fatias, d.ModeloIA).
		Scan(&d.ID, &d.ProcessadoEm)
}

func (r *Repository) GetDetailsByPhraseID(ctx context.Context, phraseID int) (*PhraseDetails, error) {
	query := `
		SELECT id, frase_id, traducao_completa, explicacao, fatias_traducoes, modelo_ia, processado_em
		FROM frase_detalhes WHERE frase_id = $1
	`
	var d PhraseDetails
	var fatias []byte
	err := r.db.QueryRow(ctx, query, phraseID).Scan(
		&d.ID, &d.FraseID, &d.TraducaoCompleta, &d.Explicacao, &fatias, &d.ModeloIA, &d.ProcessadoEm,
	)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(fatias, &d.FatiasTraducoes)
	return &d, nil
}

