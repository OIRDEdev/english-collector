package youtube

import (
	"errors"

	"github.com/horiagug/youtube-transcript-api-go/pkg/yt_transcript"
	"github.com/horiagug/youtube-transcript-api-go/pkg/yt_transcript_models"
)

type TranscriptLine struct {
	Start float64 `json:"start"`
	Dur   float64 `json:"dur"`
	Text  string  `json:"text"`
}

type Service interface {
	GetTranscript(videoID string) ([]TranscriptLine, error)
}

type service struct {
	client *yt_transcript.YtTranscriptClient
}

func NewService() Service {
	// Create a new client
	client := yt_transcript.NewClient()
	return &service{
		client: client,
	}
}

func (s *service) GetTranscript(videoID string) ([]TranscriptLine, error) {
	if videoID == "" {
		return nil, errors.New("videoID is required")
	}

	// Request all available languages
	transcripts, err := s.client.GetTranscripts(videoID, []string{})
	if err != nil {
		return nil, err
	}

	if len(transcripts) == 0 {
		return []TranscriptLine{}, nil
	}

	// Try to find English first, otherwise pick the first available
	var selectedTranscript *yt_transcript_models.Transcript
	for _, t := range transcripts {
		if t.LanguageCode == "en" || t.LanguageCode == "en-US" || t.LanguageCode == "en-GB" {
			selectedTranscript = &t
			break
		}
	}
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
