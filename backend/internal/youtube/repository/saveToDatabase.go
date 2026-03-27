package repository

import (
	"context"
	"encoding/json"
	"extension-backend/internal/youtube/domain"
	"fmt"
	"log"
)

func (r *youtubeRepository) SaveToDatabase(ctx context.Context, videoID, lang, time string, segments []domain.TranslationSegment) error {
	if r.db == nil {
		return nil
	}
	data, err := json.Marshal(segments)
	if err != nil {
		return fmt.Errorf("failed to marshal segments: %w", err)
	}

	query := `
		INSERT INTO videos (video_id, idioma, transcricao, Time)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (video_id, idioma, Time) DO UPDATE SET transcricao = $3, atualizado_em = CURRENT_TIMESTAMP
	`
	_, err = r.db.Exec(ctx, query, videoID, lang, data, time)
	if err != nil {
		log.Printf("[db-repository] failed to save to database: %v", err)
		return err
	}

	return nil
}
