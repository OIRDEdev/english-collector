package middleware

import (
	"context"
	"net/http"
	"strings"

	"extension-backend/internal/user"
)

type contextKey string

const UserContextKey contextKey = "user"

func Auth(tokenService *user.TokenService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "authorization header required", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "invalid authorization header", http.StatusUnauthorized)
				return
			}

			claims, err := tokenService.ValidateAccessToken(parts[1])
			if err != nil {
				http.Error(w, "invalid token", http.StatusUnauthorized)
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
