package youtube_test

import (
	"context"
	"encoding/json"
	"testing"

	"extension-backend/internal/youtube"
)

func TestYouTubeService_GetTranscript_Integration(t *testing.T) {
	// Arrange
	videoID := "dQw4w9WgXcQ"
	svc := youtube.NewService(nil, nil) // DBTX and aiService are unneeded for strict integration logic when lang="en" 

	// Act
	// Forçando en-US na query para pular verificação de banco pelo JWT
	lines, err := svc.GetTranscript(context.Background(), videoID, "en", "pt", 0, 0)

	// Assert
	if err != nil {
		t.Fatalf("Esperava sucesso, mas falhou: %v", err)
	}

	if len(lines) == 0 {
		t.Fatalf("O vídeo ID %s deveria possuir legendas ativas.", videoID)
	}

	// Verify first few lines structure
	t.Logf("Video: %s | Total de linhas trazidas: %d", videoID, len(lines))

	data, _ := json.MarshalIndent(lines[:3], "", "  ")
	t.Logf("Exibindo as %d primeiras legendas do payload:\n%s", 3, string(data))

	// Ensure the line has expected properties in the learning language
	if lines[0].Start < 0 || lines[0].Dur <= 0 || lines[0].TextEn == "" {
		t.Errorf("Valores inválidos capturados na TranslationSegment[0]: %+v", lines[0])
	}
}
