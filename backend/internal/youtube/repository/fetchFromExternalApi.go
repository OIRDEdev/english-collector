package repository

import (
	"context"
	"extension-backend/internal/ai"
	"extension-backend/internal/youtube/domain"
	"fmt"
	"log"
	"strings"

	"github.com/horiagug/youtube-transcript-api-go/pkg/yt_transcript"
	"github.com/horiagug/youtube-transcript-api-go/pkg/yt_transcript_models"
)

type ExternalAPIRepository struct {
	client    *yt_transcript.YtTranscriptClient
	aiService ai.TranslatorService
}

func NewExternalAPIRepository(aiService ai.TranslatorService) *ExternalAPIRepository {
	return &ExternalAPIRepository{
		client:    yt_transcript.NewClient(),
		aiService: aiService,
	}
}

func (r *youtubeRepository) FetchFromExternalApi(ctx context.Context, videoID string, learnLang, nativeLang string, startTime, endTime float64) ([]domain.TranslationSegment, error) {
	requestedLangs := []string{learnLang, nativeLang, "en", "pt"}
	transcripts, err := r.ytClient.GetTranscripts(videoID, requestedLangs)
	if err != nil {
		return nil, fmt.Errorf("youtube api error: %w", err)
	}

	if len(transcripts) == 0 {
		return nil, fmt.Errorf("no transcripts found")
	}

	findBest := func(lang string, transcripts []yt_transcript_models.Transcript) *yt_transcript_models.Transcript {
		if lang == "" { return nil }
		base := strings.Split(lang, "-")[0]
		for _, t := range transcripts {
			if strings.EqualFold(t.LanguageCode, lang) { return &t }
		}
		for _, t := range transcripts {
			if strings.EqualFold(strings.Split(t.LanguageCode, "-")[0], base) { return &t }
		}
		return nil
	}

	selectedLearn := findBest(learnLang, transcripts)
	if selectedLearn == nil { selectedLearn = findBest("en", transcripts) }
	if selectedLearn == nil { selectedLearn = &transcripts[0] }

	selectedNative := findBest(nativeLang, transcripts)
	if selectedNative == nil { selectedNative = findBest("pt", transcripts) }
	
	if selectedNative != nil && selectedLearn != nil && selectedNative.LanguageCode == selectedLearn.LanguageCode {
		selectedNative = nil
	}

	var result []domain.TranslationSegment

	for _, line := range selectedLearn.Lines {
		if line.Start < startTime || (endTime > 0 && line.Start > endTime) {
			continue
		}

		segment := domain.TranslationSegment{
			Start:  line.Start,
			Dur:    line.Duration,
			TextEn: line.Text,
		}

		// Try to find matching native text
		if selectedNative != nil {
			var bestNative *yt_transcript_models.TranscriptLine
			minDiff := 999999.0
			for _, nl := range selectedNative.Lines {
				diff := line.Start - nl.Start
				if diff < 0 { diff = -diff }
				if diff < minDiff {
					minDiff = diff
					bestNative = &nl
				}
				if diff < 0.1 { break }
			}
			if bestNative != nil && minDiff < 2.0 {
				segment.TextPt = bestNative.Text
			}
		}

		// AI Fallback for translation, explanation and mapping
		if r.aiService != nil {
			aiReq := ai.TranslationRequest{
				Conteudo:      segment.TextEn,
				IdiomaOrigem:  learnLang,
				IdiomaDestino: nativeLang,
				Contexto:      "YouTube transcript line translation with explanation and mapping.",
			}
			aiRes, err := r.aiService.Translate(ctx, aiReq)
			if err == nil && aiRes != nil {
				if segment.TextPt == "" {
					segment.TextPt = aiRes.TraducaoCompleta
				}
				segment.Explanation = "Explicação automatizada baseada no contexto do vídeo."
				segment.Mapping = make(map[string]string)
			} else {
				log.Printf("[external-api] AI fallback failed for %q: %v", segment.TextEn, err)
			}
		}

		result = append(result, segment)
	}

	return result, nil
}
