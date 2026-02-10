package cache

import (
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"log"
	"net/http"
	"time"
)

// cachedResponseWriter captura a resposta para armazenar em cache
type cachedResponseWriter struct {
	http.ResponseWriter
	statusCode int
	body       *bytes.Buffer
}

func (w *cachedResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *cachedResponseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// Middleware cria um middleware HTTP de cache para uma rota específica
func (c *Client) Middleware(prefix string, ttl time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Só cacheia GET
			if r.Method != http.MethodGet {
				next.ServeHTTP(w, r)
				return
			}

			ctx := r.Context()
			key := buildKey(prefix, r)

			// Tenta buscar do cache
			cached, err := c.Get(ctx, key)
			if err == nil {
				log.Printf("[Cache] HIT %s", key)
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("X-Cache", "HIT")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(cached))
				return
			}

			// Cache MISS - executa handler e captura resposta
			log.Printf("[Cache] MISS %s", key)
			recorder := &cachedResponseWriter{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
				body:           &bytes.Buffer{},
			}

			recorder.Header().Set("X-Cache", "MISS")
			next.ServeHTTP(recorder, r)

			// Só cacheia respostas de sucesso
			if recorder.statusCode >= 200 && recorder.statusCode < 300 {
				body := recorder.body.String()
				go func() {
					// Usa context.Background() pois o ctx do request é cancelado após a resposta
					if err := c.Set(context.Background(), key, body, ttl); err != nil {
						log.Printf("[Cache] Failed to cache %s: %v", key, err)
					}
				}()
			}
		})
	}
}

// buildKey gera a chave de cache baseada no path + query params
func buildKey(prefix string, r *http.Request) string {
	raw := r.URL.Path
	if r.URL.RawQuery != "" {
		raw += "?" + r.URL.RawQuery
	}
	hash := sha256.Sum256([]byte(raw))
	return fmt.Sprintf("cache:%s:%x", prefix, hash[:8])
}
