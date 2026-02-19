package repository

import (
	"context"
	"encoding/json"
	"fmt"
)

// UpdateConfig atualiza parcialmente o campo config JSONB, fazendo merge com os valores existentes.
func (r *Repository) UpdateConfig(ctx context.Context, userID int, config map[string]any) error {
	configJSON, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	query := `
		UPDATE preferencias_usuario
		SET config = COALESCE(config, '{}'::jsonb) || $1::jsonb
		WHERE usuario_id = $2
	`

	result, err := r.db.Exec(ctx, query, configJSON, userID)
	if err != nil {
		return fmt.Errorf("failed to update config: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("settings not found for user %d", userID)
	}

	return nil
}
