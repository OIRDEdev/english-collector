package youtube

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"strings"

	"extension-backend/internal/http/middleware"

	"github.com/horiagug/youtube-transcript-api-go/pkg/yt_transcript"
	"github.com/horiagug/youtube-transcript-api-go/pkg/yt_transcript_models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type DBTX interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type TranscriptLine struct {
	Start float64 `json:"start"`
	Dur   float64 `json:"dur"`
	Text  string  `json:"text"`
}

type Service interface {
	GetTranscript(ctx context.Context, videoID string, queryLang string) ([]TranscriptLine, error)
}

type service struct {
	db     DBTX
	client *yt_transcript.YtTranscriptClient
}

func NewService(db DBTX) Service {
	// Create a new client
	client := yt_transcript.NewClient()
	return &service{
		db:     db,
		client: client,
	}
}

// ─────────────────── Cache helpers ───────────────────

func (s *service) getCachedTranscript(ctx context.Context, videoID, lang string) ([]TranscriptLine, bool) {
	if s.db == nil {
		return nil, false
	}
	query := `SELECT transcricao FROM videos WHERE video_id = $1 AND idioma = $2`
	var raw []byte
	err := s.db.QueryRow(ctx, query, videoID, lang).Scan(&raw)
	if err != nil {
		return nil, false
	}
	var lines []TranscriptLine
	if err := json.Unmarshal(raw, &lines); err != nil {
		return nil, false
	}
	return lines, true
}

func (s *service) saveCachedTranscript(ctx context.Context, videoID, lang string, lines []TranscriptLine) {
	if s.db == nil {
		return
	}
	data, err := json.Marshal(lines)
	if err != nil {
		log.Printf("[youtube-cache] falha ao serializar transcript: %v", err)
		return
	}
	query := `
		INSERT INTO videos (video_id, idioma, transcricao)
		VALUES ($1, $2, $3)
		ON CONFLICT (video_id, idioma) DO UPDATE SET transcricao = $3, atualizado_em = CURRENT_TIMESTAMP
	`
	_, err = s.db.Exec(ctx, query, videoID, lang, data)
	if err != nil {
		log.Printf("[youtube-cache] falha ao salvar cache: %v", err)
	}
}

// ─────────────────── Main Method ───────────────────

func (s *service) GetTranscript(ctx context.Context, videoID string, queryLang string) ([]TranscriptLine, error) {
	if videoID == "" {
		return nil, errors.New("videoID is required")
	}

	targetLang := queryLang

	// If no lang is explicitly provided, fetch from the database via authenticated user context
	if targetLang == "" {
		claims := middleware.GetUserFromContext(ctx)
		if claims != nil && s.db != nil {
			query := `
				SELECT i.codigo
				FROM usuarios u
				JOIN idiomas i ON u.idioma_aprendizado_id = i.id
				WHERE u.id = $1
			`
			var langCode string
			err := s.db.QueryRow(ctx, query, claims.UserID).Scan(&langCode)
			if err == nil && langCode != "" {
				targetLang = langCode
			}
		}
	}

	// Resolve effective language key for cache (use targetLang or "default")
	cacheKey := targetLang
	if cacheKey == "" {
		cacheKey = "default"
	}

	// 1) Check DB cache first
	if cached, ok := s.getCachedTranscript(ctx, videoID, cacheKey); ok {
		log.Printf("[youtube-cache] HIT video=%s lang=%s (%d linhas)", videoID, cacheKey, len(cached))
		return cached, nil
	}

	// 2) Cache miss — fetch from YouTube API
	transcripts, err := s.client.GetTranscripts(videoID, []string{})
	if err != nil {
		return nil, err
	}

	if len(transcripts) == 0 {
		return []TranscriptLine{}, nil
	}

	// Try to find the requested language first, fallback to variations
	var selectedTranscript *yt_transcript_models.Transcript
	
	if targetLang != "" {
		targetBase := strings.Split(targetLang, "-")[0]

		for _, t := range transcripts {
			// First try exact match
			if strings.EqualFold(t.LanguageCode, targetLang) {
				selectedTranscript = &t
				break
			}
			// Then try base match (e.g. matched "en" with "en-US")
			if strings.EqualFold(strings.Split(t.LanguageCode, "-")[0], targetBase) {
				selectedTranscript = &t
				break
			}
		}
	}

	// Existing original fallback to English specifically if neither lang was found or queried
	if selectedTranscript == nil {
		for _, t := range transcripts {
			if t.LanguageCode == "en" || t.LanguageCode == "en-US" || t.LanguageCode == "en-GB" {
				selectedTranscript = &t
				break
			}
		}
	}

	// Absolute fallback to first available
	if selectedTranscript == nil {
		selectedTranscript = &transcripts[0]
	}

	var result []TranscriptLine
	for _, line := range selectedTranscript.Lines {
		result = append(result, TranscriptLine{
			Start: line.Start,
			Dur:   line.Duration,
			Text:  line.Text,
		})
	}

	// 3) Save to DB cache for future requests
	s.saveCachedTranscript(ctx, videoID, cacheKey, result)
	log.Printf("[youtube-cache] MISS video=%s lang=%s → salvando %d linhas", videoID, cacheKey, len(result))

	return result, nil
}
