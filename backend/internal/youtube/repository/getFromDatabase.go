package repository

import (
	"context"
	"encoding/json"
	"extension-backend/internal/youtube/domain"
	"fmt"
	"log"
)

func (r *youtubeRepository) GetFromDatabase(ctx context.Context, videoID, lang, time string) ([]domain.TranslationSegment, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	if lang == "" || lang == ":" {
		return nil, fmt.Errorf("invalid language specification: %s", lang)
	}

	log.Printf("[repository] GetFromDatabase: videoID=%s, lang=%s, time=%s", videoID, lang, time)
	var raw []byte
	query := `SELECT transcricao FROM videos WHERE video_id = $1 AND idioma = $2 AND "Time" = $3`
	
	err := r.db.QueryRow(ctx, query, videoID, lang, time).Scan(&raw)
	if err != nil {
		return nil, err
	}

	var segments []domain.TranslationSegment
	if err := json.Unmarshal(raw, &segments); err != nil {
		return nil, fmt.Errorf("failed to unmarshal database transcript: %w", err)
	}

	return segments, nil
}
