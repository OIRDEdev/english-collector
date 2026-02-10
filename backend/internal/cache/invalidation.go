package cache

import (
	"log"
	"net/http"
)

// InvalidateOn cria um middleware que invalida cache após mutações (POST/PUT/DELETE)
func (c *Client) InvalidateOn(patterns ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)

			// Invalida cache após mutações bem-sucedidas
			if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodDelete {
				go func() {
					ctx := r.Context()
					for _, pattern := range patterns {
						if err := c.DeleteByPattern(ctx, pattern); err != nil {
							log.Printf("[Cache] Failed to invalidate pattern %s: %v", pattern, err)
						} else {
							log.Printf("[Cache] Invalidated pattern %s", pattern)
						}
					}
				}()
			}
		})
	}
}
