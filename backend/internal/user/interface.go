package user

import "context"

type ServiceInterface interface {
	Create(ctx context.Context, input CreateInput) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
	GetAll(ctx context.Context) ([]User, error)
	Update(ctx context.Context, id string, input UpdateInput) (*User, error)
	Delete(ctx context.Context, id string) error
	Register(ctx context.Context, input RegisterInput, ip, userAgent string) (*AuthTokens, error)
	Login(ctx context.Context, input LoginInput, ip, userAgent string) (*AuthTokens, error)
	RefreshTokens(ctx context.Context, refreshToken, ip, userAgent string) (*AuthTokens, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	LoginWithoutPassword(ctx context.Context, email, ip, userAgent string) (*AuthTokens, error)
}
