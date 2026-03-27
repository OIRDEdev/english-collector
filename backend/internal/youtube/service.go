package youtube

import (
	"context"
	"extension-backend/internal/ai"
	"extension-backend/internal/youtube/domain"
	"extension-backend/internal/youtube/repository"
	"extension-backend/internal/youtube/service"
)

type Service interface {
	GetTranscript(ctx context.Context, videoID string, learnLang, nativeLang string, startTime, endTime float64) ([]domain.TranslationSegment, error)
}

func NewService(db repository.Database, aiService ai.TranslatorService) Service {
	repo := repository.NewRepository(db, aiService)
	return service.NewTranslationService(repo)
}

// The implementation has been moved to repository and service subpackages.
