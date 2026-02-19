package middleware

import (
	"context"
	"net/http"
	"strings"

	"extension-backend/internal/user"
)

type contextKey string

const UserContextKey contextKey = "user"

// Auth middleware — reads JWT from:
// 1. Cookie "access_token" (browser/extension)
// 2. Header "Authorization: Bearer ..." (API clients)
func Auth(tokenService *user.TokenService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenString string

			// 1. Try cookie first
			if cookie, err := r.Cookie("access_token"); err == nil && cookie.Value != "" {
				tokenString = cookie.Value
			}

			// 2. Fallback to Authorization header
			if tokenString == "" {
				authHeader := r.Header.Get("Authorization")
				if authHeader != "" {
					parts := strings.Split(authHeader, " ")
					if len(parts) == 2 && parts[0] == "Bearer" {
						tokenString = parts[1]
					}
				}
			}

			// No token found
			if tokenString == "" {
				http.Error(w, "authentication required", http.StatusUnauthorized)
				return
			}

			claims, err := tokenService.ValidateAccessToken(tokenString)
			if err != nil {
				http.Error(w, "invalid or expired token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserFromContext(ctx context.Context) *user.TokenClaims {
	claims, ok := ctx.Value(UserContextKey).(*user.TokenClaims)
	if !ok {
		return nil
	}
	return claims
}
