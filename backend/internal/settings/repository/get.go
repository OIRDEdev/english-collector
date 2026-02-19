package repository

import (
	"context"
	"encoding/json"
	"fmt"
)

// GetByUserID busca as preferências do usuário pelo ID.
// Retorna nil se não encontrar (usuário ainda não fez onboarding).
func (r *Repository) GetByUserID(ctx context.Context, userID int) (*UserSettings, error) {
	query := `
		SELECT id, usuario_id, idioma_padrao_traducao, auto_traduzir, tema_interface,
		       nivel_proficiencia, minutos_diarios, cards_diarios, onboarding_completo, config
		FROM preferencias_usuario
		WHERE usuario_id = $1
	`

	var s UserSettings
	var configJSON []byte

	err := r.db.QueryRow(ctx, query, userID).Scan(
		&s.ID, &s.UsuarioID, &s.IdiomaPadraoTraducao, &s.AutoTraduzir,
		&s.TemaInterface, &s.NivelProficiencia, &s.MinutosDiarios,
		&s.CardsDiarios, &s.OnboardingCompleto, &configJSON,
	)
	if err != nil {
		return nil, fmt.Errorf("settings not found: %w", err)
	}

	if configJSON != nil {
		if err := json.Unmarshal(configJSON, &s.Config); err != nil {
			return nil, fmt.Errorf("failed to parse config: %w", err)
		}
	} else {
		s.Config = make(map[string]any)
	}

	return &s, nil
}
