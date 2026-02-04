package user

import "context"

type ServiceInterface interface {
	Create(ctx context.Context, input CreateInput) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
	GetAll(ctx context.Context) ([]User, error)
	Update(ctx context.Context, id string, input UpdateInput) (*User, error)
	Delete(ctx context.Context, id string) error
	Register(ctx context.Context, input RegisterInput) (*User, error)
	Login(ctx context.Context, input LoginInput) (*AuthTokens, error)
	RefreshTokens(ctx context.Context, refreshToken string) (*AuthTokens, error)
}
