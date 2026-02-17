package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"extension-backend/internal/user"
)

const GoogleClientID = "971837374738-3k3m704hipkqckl15q7qn38n97oqulgs.apps.googleusercontent.com"

type Service struct {
	userService user.ServiceInterface
}

func NewService(userService user.ServiceInterface) *Service {
	return &Service{
		userService: userService,
	}
}

func (s *Service) Login(ctx context.Context, email, password, ip, userAgent string) (*user.AuthTokens, error) {
	return s.userService.Login(ctx, user.LoginInput{Email: email, Senha: password}, ip, userAgent)
}

func (s *Service) Register(ctx context.Context, nome, email, password, ip, userAgent string) (*user.AuthTokens, error) {
	return s.userService.Register(ctx, user.RegisterInput{Nome: nome, Email: email, Senha: password}, ip, userAgent)
}

func (s *Service) RefreshToken(ctx context.Context, refreshToken, ip, userAgent string) (*user.AuthTokens, error) {
	return s.userService.RefreshTokens(ctx, refreshToken, ip, userAgent)
}

func (s *Service) GoogleLogin(ctx context.Context, credential, ip, userAgent string) (*user.AuthTokens, error) {
	// 1. Verify Google Token
	claims, err := s.verifyGoogleToken(ctx, credential)
	if err != nil {
		return nil, fmt.Errorf("invalid google token: %w", err)
	}

	// 2. Check if user exists
	_, err = s.userService.GetByEmail(ctx, claims.Email)
	if err != nil {
		// User does not exist, register them
        // TODO: Generate a random password or mark as social login
        // For now, we will use a workaround or just register with a random password
        // But s.Register requires password.
		// Let's just pass a long random string as password for now.
		randomPassword := "GOOGLE_LOGIN_" + time.Now().String() // In production use proper random
        return s.userService.Register(ctx, user.RegisterInput{
            Nome: claims.Name,
            Email: claims.Email,
            Senha: randomPassword,
        }, ip, userAgent)
	}

    // 3. User exists, force login
	return s.userService.LoginWithoutPassword(ctx, claims.Email, ip, userAgent)
}

type GoogleClaims struct {
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Sub           string `json:"sub"`
    Aud           string `json:"aud"`
}

func (s *Service) verifyGoogleToken(ctx context.Context, token string) (*GoogleClaims, error) {
	// Simple validation using Google's tokeninfo endpoint
	url := "https://oauth2.googleapis.com/tokeninfo?id_token=" + token
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("token validation failed")
	}

	var claims GoogleClaims
	if err := json.NewDecoder(resp.Body).Decode(&claims); err != nil {
		return nil, err
	}

	if claims.Aud != GoogleClientID {
		return nil, errors.New("invalid audience")
	}
    
    if !claims.EmailVerified {
        return nil, errors.New("email not verified")
    }

	return &claims, nil
}