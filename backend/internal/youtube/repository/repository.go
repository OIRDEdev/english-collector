package repository

import (
	"context"
	"extension-backend/internal/ai"
	"extension-backend/internal/youtube/domain"
	"sync"
	"github.com/horiagug/youtube-transcript-api-go/pkg/yt_transcript"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type Database interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type Repository interface {
	GetFromCache(videoID, lang string) ([]domain.TranslationSegment, bool)
	SaveToCache(videoID, lang string, segments []domain.TranslationSegment)
	GetFromDatabase(ctx context.Context, videoID, lang, time string) ([]domain.TranslationSegment, error)
	SaveToDatabase(ctx context.Context, videoID, lang, time string, segments []domain.TranslationSegment) error
	FetchFromExternalApi(ctx context.Context, videoID string, learnLang, nativeLang string, startTime, endTime float64) ([]domain.TranslationSegment, error)
}

type youtubeRepository struct {
	cache     sync.Map
	db        Database
	ytClient  *yt_transcript.YtTranscriptClient
	aiService ai.TranslatorService
}

func NewRepository(db Database, aiService ai.TranslatorService) Repository {
	return &youtubeRepository{
		db:        db,
		ytClient:  yt_transcript.NewClient(),
		aiService: aiService,
	}
}

// Satisfying the interface by delegating or implementing directly
func (r *youtubeRepository) GetFromCache(videoID, lang string) ([]domain.TranslationSegment, bool) {
	key := videoID + ":" + lang
	val, ok := r.cache.Load(key)
	if !ok { return nil, false }
	return val.([]domain.TranslationSegment), true
}

func (r *youtubeRepository) SaveToCache(videoID, lang string, segments []domain.TranslationSegment) {
	key := videoID + ":" + lang
	r.cache.Store(key, segments)
}
