package exercises

import "context"

// RepositoryInterface define as operações de acesso a dados de exercícios
type RepositoryInterface interface {
	GetByID(ctx context.Context, id int) (*Exercicio, error)
	GetByType(ctx context.Context, tipo string, userID int) ([]Exercicio, error)
	GetAllForUser(ctx context.Context, userID int) ([]Exercicio, error)
}

// ServiceInterface define a lógica de negócio de exercícios
type ServiceInterface interface {
	GetByID(ctx context.Context, id int) (*Exercicio, error)
	ListGrouped(ctx context.Context, userID int) ([]ExerciseGroup, error)
	GetByType(ctx context.Context, userID int, tipo string) ([]Exercicio, error)
}
