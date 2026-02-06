package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"extension-backend/internal/ai"
	"extension-backend/internal/phrase"
	"extension-backend/internal/sse"
)

type AIMiddleware struct {
	aiService     *ai.Service
	phraseService phrase.ServiceInterface
	sseHub        *sse.Hub
}

func NewAIMiddleware(aiService *ai.Service, phraseService phrase.ServiceInterface, sseHub *sse.Hub) *AIMiddleware {
	return &AIMiddleware{
		aiService:     aiService,
		phraseService: phraseService,
		sseHub:        sseHub,
	}
}

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
	body       *bytes.Buffer
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

func (m *AIMiddleware) ProcessTranslation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if m.aiService == nil {
			next.ServeHTTP(w, r)
			return
		}

		bodyBytes, _ := io.ReadAll(r.Body)
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		var requestData struct {
			IdiomaOrigem  string `json:"idioma_origem"`
			IdiomaDestino string `json:"idioma_destino"`
			Conteudo      string `json:"conteudo"`
			Contexto      string `json:"contexto"`
		}
		json.Unmarshal(bodyBytes, &requestData)

		if requestData.IdiomaOrigem == "" {
			requestData.IdiomaOrigem = "en"
		}
		if requestData.IdiomaDestino == "" {
			requestData.IdiomaDestino = "pt-BR"
		}

		recorder := &responseRecorder{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
			body:           &bytes.Buffer{},
		}

		next.ServeHTTP(recorder, r)

		if recorder.statusCode >= 200 && recorder.statusCode < 300 {
			go m.processAITranslation(
				requestData.Conteudo,
				requestData.IdiomaOrigem,
				requestData.IdiomaDestino,
				requestData.Contexto,
				recorder.body.Bytes(),
			)
		}
	})
}

func (m *AIMiddleware) processAITranslation(conteudo, idiomaOrigem, idiomaDestino, contexto string, responseBody []byte) {
	var response struct {
		Data *phrase.Phrase `json:"data"`
	}
	if err := json.Unmarshal(responseBody, &response); err != nil || response.Data == nil {
		log.Printf("[AI] Failed to parse phrase response: %v", err)
		return
	}

	phraseID := response.Data.ID
	if phraseID == 0 {
		return
	}

	ctx := context.Background()
	aiResponse, err := m.aiService.Translate(ctx, ai.TranslationRequest{
		ID:            phraseID,
		Conteudo:      conteudo,
		IdiomaOrigem:  idiomaOrigem,
		IdiomaDestino: idiomaDestino,
		Contexto:      contexto,
	})
	if err != nil {
		log.Printf("[AI] Translation failed for phrase %d: %v", phraseID, err)
		// Broadcast error via SSE
		if m.sseHub != nil {
			m.sseHub.Broadcast(sse.Event{
				Type: "translation_error",
				Payload: map[string]interface{}{
					"phrase_id": phraseID,
					"error":     err.Error(),
				},
			})
		}
		return
	}

	_, err = m.phraseService.AddDetails(ctx, phrase.CreateDetailsInput{
		FraseID:          phraseID,
		TraducaoCompleta: aiResponse.TraducaoCompleta,
		Explicacao:       aiResponse.Explicacao,
		FatiasTraducoes:  aiResponse.FatiasTraducoes,
		ModeloIA:         aiResponse.ModeloIA,
	})
	if err != nil {
		log.Printf("[AI] Failed to save details for phrase %d: %v", phraseID, err)
		return
	}

	log.Printf("[AI] Translation saved for phrase %d", phraseID)

	// Broadcast tradução via SSE
	if m.sseHub != nil {
		m.sseHub.BroadcastTranslation(
			phraseID,
			aiResponse.TraducaoCompleta,
			aiResponse.Explicacao,
			aiResponse.FatiasTraducoes,
			aiResponse.ModeloIA,
		)
	}
}
