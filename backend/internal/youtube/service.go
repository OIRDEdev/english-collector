package youtube

import (
	"context"
	"errors"
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

	// Request all available languages
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

	return result, nil
}
