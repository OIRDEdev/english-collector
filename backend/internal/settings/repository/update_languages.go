package repository

import (
	"context"
	"fmt"
)

// UpdateUserLanguages atualiza os idiomas do usuário na tabela usuarios.
func (r *Repository) UpdateUserLanguages(ctx context.Context, userID int, nativeLang, targetLang string) error {
	query := `
		UPDATE usuarios
		SET lingua_origem = $1, lingua_de_aprendizado = $2
		WHERE id = $3
	`

	result, err := r.db.Exec(ctx, query, nativeLang, targetLang, userID)
	if err != nil {
		return fmt.Errorf("failed to update languages: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("user %d not found", userID)
	}

	return nil
}
