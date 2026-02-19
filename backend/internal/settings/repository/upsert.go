package repository

import (
	"context"
	"encoding/json"
	"fmt"
)

// Upsert insere ou atualiza as preferências do usuário.
// Verifica se já existe um registro para o usuário e decide entre INSERT e UPDATE.
func (r *Repository) Upsert(ctx context.Context, s *UserSettings) error {
	configJSON, err := json.Marshal(s.Config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Verificar se já existe
	var existingID int
	checkQuery := `SELECT id FROM preferencias_usuario WHERE usuario_id = $1`
	err = r.db.QueryRow(ctx, checkQuery, s.UsuarioID).Scan(&existingID)

	if err != nil {
		// Não existe, inserir
		insertQuery := `
			INSERT INTO preferencias_usuario (
				usuario_id, idioma_padrao_traducao, auto_traduzir, tema_interface,
				nivel_proficiencia, minutos_diarios, cards_diarios, onboarding_completo, config
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING id
		`
		return r.db.QueryRow(ctx, insertQuery,
			s.UsuarioID, s.IdiomaPadraoTraducao, s.AutoTraduzir, s.TemaInterface,
			s.NivelProficiencia, s.MinutosDiarios, s.CardsDiarios, s.OnboardingCompleto,
			configJSON,
		).Scan(&s.ID)
	}

	// Existe, atualizar
	s.ID = existingID
	updateQuery := `
		UPDATE preferencias_usuario SET
			idioma_padrao_traducao = $1,
			auto_traduzir = $2,
			tema_interface = $3,
			nivel_proficiencia = $4,
			minutos_diarios = $5,
			cards_diarios = $6,
			onboarding_completo = $7,
			config = $8
		WHERE id = $9
	`
	_, err = r.db.Exec(ctx, updateQuery,
		s.IdiomaPadraoTraducao, s.AutoTraduzir, s.TemaInterface,
		s.NivelProficiencia, s.MinutosDiarios, s.CardsDiarios, s.OnboardingCompleto,
		configJSON, existingID,
	)
	return err
}
