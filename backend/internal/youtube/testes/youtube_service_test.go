package youtube_test

import (
	"encoding/json"
	"testing"

	"extension-backend/internal/youtube"
)

func TestYouTubeService_GetTranscript_Integration(t *testing.T) {
	// Arrange
	videoID := "XrZ2zF2b9zU"
	svc := youtube.NewService()

	// Act
	lines, err := svc.GetTranscript(videoID)

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

	// Ensure the line has expected properties
	if lines[0].Start < 0 || lines[0].Dur <= 0 || lines[0].Text == "" {
		t.Errorf("Valores inválidos capturados na TranscriptLine[0]: %+v", lines[0])
	}
}
