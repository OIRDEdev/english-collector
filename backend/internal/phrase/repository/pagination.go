package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"extension-backend/internal/phrase"
)

// GetAllPaginated busca frases COM detalhes usando paginação por cursor
func (r *Repository) GetAllPaginated(ctx context.Context, params phrase.PaginationParams) (*phrase.PaginatedResult[phrase.PhraseWithDetails], error) {
	limit := phrase.NormalizeLimit(params.Limit)

	cursor, err := phrase.DecodeCursor(params.Cursor)
	if err != nil {
		return nil, fmt.Errorf("invalid cursor: %w", err)
	}

	var args []any
	var whereClause string

	if cursor != nil {
		whereClause = "WHERE (f.capturado_em, f.id) < ($1, $2)"
		args = []any{cursor.CreatedAt, cursor.ID, limit + 1}
	} else {
		args = []any{limit + 1}
	}

	query := fmt.Sprintf(`
		SELECT 
			f.id, f.usuario_id, f.conteudo, f.idioma_origem, 
			f.url_origem, f.titulo_pagina, f.capturado_em,
			d.traducao_completa, d.explicacao, d.fatias_traducoes, d.modelo_ia
		FROM frases f
		LEFT JOIN frase_detalhes d ON d.frase_id = f.id
		%s
		ORDER BY f.capturado_em DESC, f.id DESC
		LIMIT $%d
	`, whereClause, len(args))

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phrases []phrase.PhraseWithDetails
	for rows.Next() {
		var p phrase.PhraseWithDetails
		var traducao, explicacao, modeloIA *string
		var fatias []byte

		if err := rows.Scan(
			&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem,
			&p.URLOrigem, &p.TituloPagina, &p.CapturadoEm,
			&traducao, &explicacao, &fatias, &modeloIA,
		); err != nil {
			return nil, err
		}

		if traducao != nil {
			p.Detalhes = &phrase.Details{TraducaoCompleta: *traducao}
			if explicacao != nil {
				p.Detalhes.Explicacao = *explicacao
			}
			if modeloIA != nil {
				p.Detalhes.ModeloIA = *modeloIA
			}
			if len(fatias) > 0 {
				json.Unmarshal(fatias, &p.Detalhes.FatiasTraducoes)
			}
		}

		phrases = append(phrases, p)
	}

	hasMore := len(phrases) > limit
	if hasMore {
		phrases = phrases[:limit]
	}

	var nextCursor string
	if hasMore && len(phrases) > 0 {
		last := phrases[len(phrases)-1]
		nextCursor = (&phrase.Cursor{CreatedAt: last.CapturadoEm, ID: last.ID}).Encode()
	}

	return &phrase.PaginatedResult[phrase.PhraseWithDetails]{
		Data:       phrases,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}, nil
}

// GetByUserIDPaginated busca frases de um usuário COM detalhes usando paginação
func (r *Repository) GetByUserIDPaginated(ctx context.Context, userID int, params phrase.PaginationParams) (*phrase.PaginatedResult[phrase.PhraseWithDetails], error) {
	limit := phrase.NormalizeLimit(params.Limit)

	cursor, err := phrase.DecodeCursor(params.Cursor)
	if err != nil {
		return nil, fmt.Errorf("invalid cursor: %w", err)
	}

	var args []any
	var whereClause string

	if cursor != nil {
		whereClause = "WHERE f.usuario_id = $1 AND (f.capturado_em, f.id) < ($2, $3)"
		args = []any{userID, cursor.CreatedAt, cursor.ID, limit + 1}
	} else {
		whereClause = "WHERE f.usuario_id = $1"
		args = []any{userID, limit + 1}
	}

	query := fmt.Sprintf(`
		SELECT 
			f.id, f.usuario_id, f.conteudo, f.idioma_origem, 
			f.url_origem, f.titulo_pagina, f.capturado_em,
			d.traducao_completa, d.explicacao, d.fatias_traducoes, d.modelo_ia
		FROM frases f
		LEFT JOIN frase_detalhes d ON d.frase_id = f.id
		%s
		ORDER BY f.capturado_em DESC, f.id DESC
		LIMIT $%d
	`, whereClause, len(args))

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phrases []phrase.PhraseWithDetails
	for rows.Next() {
		var p phrase.PhraseWithDetails
		var traducao, explicacao, modeloIA *string
		var fatias []byte

		if err := rows.Scan(
			&p.ID, &p.UsuarioID, &p.Conteudo, &p.IdiomaOrigem,
			&p.URLOrigem, &p.TituloPagina, &p.CapturadoEm,
			&traducao, &explicacao, &fatias, &modeloIA,
		); err != nil {
			return nil, err
		}

		if traducao != nil {
			p.Detalhes = &phrase.Details{TraducaoCompleta: *traducao}
			if explicacao != nil {
				p.Detalhes.Explicacao = *explicacao
			}
			if modeloIA != nil {
				p.Detalhes.ModeloIA = *modeloIA
			}
			if len(fatias) > 0 {
				json.Unmarshal(fatias, &p.Detalhes.FatiasTraducoes)
			}
		}

		phrases = append(phrases, p)
	}

	hasMore := len(phrases) > limit
	if hasMore {
		phrases = phrases[:limit]
	}

	var nextCursor string
	if hasMore && len(phrases) > 0 {
		last := phrases[len(phrases)-1]
		nextCursor = (&phrase.Cursor{CreatedAt: last.CapturadoEm, ID: last.ID}).Encode()
	}

	return &phrase.PaginatedResult[phrase.PhraseWithDetails]{
		Data:       phrases,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}, nil
}
