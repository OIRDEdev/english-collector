package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"extension-backend/internal/ai/processor"
	"extension-backend/internal/phrase"
)

// AIMiddleware intercepta requisições para processar traduções
type AIMiddleware struct {
	processor *processor.Processor
}

// NewAIMiddleware cria middleware com o processor de IA
func NewAIMiddleware(p *processor.Processor) *AIMiddleware {
	return &AIMiddleware{processor: p}
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

// ProcessTranslation intercepta e dispara tradução assíncrona
func (m *AIMiddleware) ProcessTranslation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if m.processor == nil {
			next.ServeHTTP(w, r)
			return
		}

		// Captura corpo da requisição
		bodyBytes, _ := io.ReadAll(r.Body)
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		var requestData struct {
			UsuarioID     int    `json:"usuario_id"`
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

		// Executa handler original
		recorder := &responseRecorder{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
			body:           &bytes.Buffer{},
		}

		next.ServeHTTP(recorder, r)

		// Se sucesso, dispara tradução assíncrona
		if recorder.statusCode >= 200 && recorder.statusCode < 300 {
			var response struct {
				Data *phrase.Phrase `json:"data"`
			}
			if err := json.Unmarshal(recorder.body.Bytes(), &response); err == nil && response.Data != nil && response.Data.ID != 0 {
				userID := requestData.UsuarioID
				if userID == 0 && response.Data != nil {
					userID = response.Data.UsuarioID
				}
				m.processor.ProcessAsync(processor.Request{
					PhraseID:      response.Data.ID,
					UserID:        userID,
					Conteudo:      requestData.Conteudo,
					IdiomaOrigem:  requestData.IdiomaOrigem,
					IdiomaDestino: requestData.IdiomaDestino,
					Contexto:      requestData.Contexto,
				})
			}
		}
	})
}
