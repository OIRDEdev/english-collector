package user

import (
	"context"
	"fmt"
	"strconv"

	"extension-backend/internal/shared"
)

type Service struct {
	repo         *Repository
	tokenRepo    *RefreshTokenRepository
	tokenService *TokenService
}

func NewService(repo *Repository, tokenRepo *RefreshTokenRepository, tokenService *TokenService) *Service {
	return &Service{
		repo:         repo,
		tokenRepo:    tokenRepo,
		tokenService: tokenService,
	}
}

func (s *Service) Create(ctx context.Context, input CreateInput) (*User, error) {
	hash, err := shared.HashPassword(input.Senha)
	if err != nil {
		return nil, err
	}

	u := &User{
		Nome:          input.Nome,
		Email:         input.Email,
		SenhaHash:     hash,
		TokenExtensao: shared.GenerateToken(32),
	}

	if err := s.repo.Create(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*User, error) {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id")
	}
	return s.repo.GetByID(ctx, intID)
}

func (s *Service) GetAll(ctx context.Context) ([]User, error) {
	return s.repo.GetAll(ctx)
}

func (s *Service) Update(ctx context.Context, id string, input UpdateInput) (*User, error) {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id")
	}

	u, err := s.repo.GetByID(ctx, intID)
	if err != nil {
		return nil, err
	}

	if input.Nome != "" {
		u.Nome = input.Nome
	}
	if input.Email != "" {
		u.Email = input.Email
	}

	if err := s.repo.Update(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	intID, err := strconv.Atoi(id)
	if err != nil {
		return fmt.Errorf("invalid id")
	}
	return s.repo.Delete(ctx, intID)
}

func (s *Service) Register(ctx context.Context, input RegisterInput, ip, userAgent string) (*AuthTokens, error) {
	existing, _ := s.repo.GetByEmail(ctx, input.Email)
	if existing != nil {
		return nil, fmt.Errorf("email already registered")
	}

	u, err := s.Create(ctx, CreateInput{
		Nome:  input.Nome,
		Email: input.Email,
		Senha: input.Senha,
	})
	if err != nil {
		return nil, err
	}

	return s.generateTokens(ctx, u, ip, userAgent)
}

func (s *Service) Login(ctx context.Context, input LoginInput, ip, userAgent string) (*AuthTokens, error) {
	u, err := s.repo.GetByEmail(ctx, input.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if !shared.CheckPassword(input.Senha, u.SenhaHash) {
		return nil, fmt.Errorf("invalid credentials")
	}

	return s.generateTokens(ctx, u, ip, userAgent)
}

func (s *Service) RefreshTokens(ctx context.Context, refreshToken, ip, userAgent string) (*AuthTokens, error) {
	rt, err := s.tokenRepo.GetByToken(ctx, refreshToken)
	if err != nil || rt.Revogado {
		return nil, fmt.Errorf("invalid refresh token")
	}

	// Fingerprint validation (simple implementation)
	// In a real scenario, we might want to allow some flexibility or notify the user
	if rt.IP != ip || rt.UserAgent != userAgent {
		s.tokenRepo.Revoke(ctx, rt.ID) // Revoke possibly stolen token
		return nil, fmt.Errorf("suspicious activity detected")
	}

	u, err := s.repo.GetByID(ctx, rt.UsuarioID)
	if err != nil {
		return nil, err
	}

	s.tokenRepo.Revoke(ctx, rt.ID)
	return s.generateTokens(ctx, u, ip, userAgent)
}

func (s *Service) generateTokens(ctx context.Context, u *User, ip, userAgent string) (*AuthTokens, error) {
	accessToken, err := s.tokenService.GenerateAccessToken(u)
	if err != nil {
		return nil, err
	}

	refreshToken := shared.GenerateToken(64)
	if err := s.tokenRepo.Create(ctx, u.ID, refreshToken, ip, userAgent); err != nil {
		return nil, err
	}

	return &AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    3600,
	}, nil
}

func (s *Service) LoginWithoutPassword(ctx context.Context, email, ip, userAgent string) (*AuthTokens, error) {
	u, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}
	return s.generateTokens(ctx, u, ip, userAgent)
}

func (s *Service) GetByEmail(ctx context.Context, email string) (*User, error) {
	return s.repo.GetByEmail(ctx, email)
}
