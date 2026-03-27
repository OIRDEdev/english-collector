package youtube

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"extension-backend/internal/http/middleware"
	"extension-backend/internal/user"
	"extension-backend/internal/youtube/domain"
	"github.com/go-chi/chi/v5"
)

type mockService struct {
	lastLearnLang  string
	lastNativeLang string
}

func (m *mockService) GetTranscript(ctx context.Context, videoID string, learnLang, nativeLang string, startTime, endTime float64) ([]domain.TranslationSegment, error) {
	m.lastLearnLang = learnLang
	m.lastNativeLang = nativeLang
	return []domain.TranslationSegment{}, nil
}

func TestHandler_GetTranscript_LangsFromJWT(t *testing.T) {
	svc := &mockService{}
	h := NewHandler(svc)

	r := chi.NewRouter()
	r.Get("/youtube/{id}", h.GetTranscript)

	req, _ := http.NewRequest("GET", "/youtube/abc?lang=original&native=original", nil)
	
	// Mock context with claims
	claims := &user.TokenClaims{
		NativeLang:   "pt",
		LearningLang: "en",
	}
	ctx := context.WithValue(req.Context(), middleware.UserContextKey, claims)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if svc.lastLearnLang != "en" {
		t.Errorf("Expected learnLang 'en' from JWT, got '%s'", svc.lastLearnLang)
	}
	if svc.lastNativeLang != "pt" {
		t.Errorf("Expected nativeLang 'pt' from JWT, got '%s'", svc.lastNativeLang)
	}
}

func TestHandler_GetTranscript_LangsFromQuery(t *testing.T) {
	svc := &mockService{}
	h := NewHandler(svc)

	r := chi.NewRouter()
	r.Get("/youtube/{id}", h.GetTranscript)

	req, _ := http.NewRequest("GET", "/youtube/abc?lang=fr&native=es", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if svc.lastLearnLang != "fr" {
		t.Errorf("Expected learnLang 'fr' from query, got '%s'", svc.lastLearnLang)
	}
	if svc.lastNativeLang != "es" {
		t.Errorf("Expected nativeLang 'es' from query, got '%s'", svc.lastNativeLang)
	}
}
