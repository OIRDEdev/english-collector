package service

import (
	"context"
	"extension-backend/internal/youtube/domain"
	"extension-backend/internal/youtube/repository"
	"fmt"
	"log"
	"sync"
)

type TranslationService struct {
	repo  repository.Repository
	locks sync.Map
}

func NewTranslationService(repo repository.Repository) *TranslationService {
	return &TranslationService{
		repo: repo,
	}
}

func (s *TranslationService) GetTranscript(ctx context.Context, videoID string, learnLang, nativeLang string, startTime, endTime float64) ([]domain.TranslationSegment, error) {
	langKey := learnLang + ":" + nativeLang
	timeKey := fmt.Sprintf("%.0f:%.0f", startTime, endTime)

	// 1. Try Cache
	if segments, ok := s.repo.GetFromCache(videoID, langKey); ok {
		log.Printf("[service] Cache HIT for %s:%s", videoID, langKey)
		return segments, nil
	}

	// Lock per videoID to avoid concurrent external fetches
	lock, _ := s.locks.LoadOrStore(videoID+langKey+timeKey, &sync.Mutex{})
	mutex := lock.(*sync.Mutex)
	mutex.Lock()
	defer mutex.Unlock()

	// Re-check cache after acquiring lock
	if segments, ok := s.repo.GetFromCache(videoID, langKey); ok {
		return segments, nil
	}

	// 2. Try Database
	segments, err := s.repo.GetFromDatabase(ctx, videoID, langKey, timeKey)
	if err == nil {
		log.Printf("[service] Database HIT for %s:%s", videoID, langKey)
		s.repo.SaveToCache(videoID, langKey, segments)
		return segments, nil
	}

	// 3. Fetch from External API
	log.Printf("[service] Cache/DB MISS for %s:%s. Fetching from External API...", videoID, langKey)
	segments, err = s.repo.FetchFromExternalApi(ctx, videoID, learnLang, nativeLang, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch from external api: %w", err)
	}

	// 4. Save to Database and Cache
	_ = s.repo.SaveToDatabase(ctx, videoID, langKey, timeKey, segments)
	s.repo.SaveToCache(videoID, langKey, segments)

	return segments, nil
}
