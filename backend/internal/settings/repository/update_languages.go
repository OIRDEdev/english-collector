package repository

import (
	"context"
	"fmt"
)

// UpdateUserLanguages atualiza os idiomas do usuário na tabela usuarios (FK para idiomas).
func (r *Repository) UpdateUserLanguages(ctx context.Context, userID int, nativeLangID, targetLangID int) error {
	query := `
		UPDATE usuarios
		SET idioma_origem_id = $1, idioma_aprendizado_id = $2
		WHERE id = $3
	`

	result, err := r.db.Exec(ctx, query, nativeLangID, targetLangID, userID)
	if err != nil {
		return fmt.Errorf("failed to update languages: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("user %d not found", userID)
	}

	return nil
}
