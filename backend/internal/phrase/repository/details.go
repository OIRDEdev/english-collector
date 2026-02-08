package repository

import (
	"context"
	"encoding/json"

	"extension-backend/internal/phrase"
)

// CreateDetails insere detalhes da tradução
func (r *Repository) CreateDetails(ctx context.Context, d *phrase.PhraseDetails) error {
	fatias, _ := json.Marshal(d.FatiasTraducoes)
	query := `
		INSERT INTO frase_detalhes (frase_id, traducao_completa, explicacao, fatias_traducoes, modelo_ia)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, processado_em
	`
	return r.db.QueryRow(ctx, query, d.FraseID, d.TraducaoCompleta, d.Explicacao, fatias, d.ModeloIA).
		Scan(&d.ID, &d.ProcessadoEm)
}

// GetDetailsByPhraseID busca detalhes por frase ID
func (r *Repository) GetDetailsByPhraseID(ctx context.Context, phraseID int) (*phrase.PhraseDetails, error) {
	query := `
		SELECT id, frase_id, traducao_completa, explicacao, fatias_traducoes, modelo_ia, processado_em
		FROM frase_detalhes WHERE frase_id = $1
	`
	var d phrase.PhraseDetails
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
