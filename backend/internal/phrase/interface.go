package phrase

import (
	"context"
)

// RepositoryInterface define as operações do repositório
type RepositoryInterface interface {
	// CRUD
	Create(ctx context.Context, p *Phrase) error
	GetByID(ctx context.Context, id int) (*Phrase, error)
	GetByUserID(ctx context.Context, userID int) ([]Phrase, error)
	GetAll(ctx context.Context) ([]Phrase, error)
	Update(ctx context.Context, p *Phrase) error
	Delete(ctx context.Context, id int) error
	Search(ctx context.Context, userID int, term string) ([]Phrase, error)

	// Details
	CreateDetails(ctx context.Context, d *PhraseDetails) error
	GetDetailsByPhraseID(ctx context.Context, phraseID int) (*PhraseDetails, error)

	// Pagination
	GetAllPaginated(ctx context.Context, params PaginationParams) (*PaginatedResult[PhraseWithDetails], error)
	GetByUserIDPaginated(ctx context.Context, userID int, params PaginationParams) (*PaginatedResult[PhraseWithDetails], error)
}

// ServiceInterface define as operações do serviço
type ServiceInterface interface {
	Create(ctx context.Context, input CreateInput) (*Phrase, error)
	GetByID(ctx context.Context, id string) (*Phrase, error)
	GetByUserID(ctx context.Context, userID int) ([]Phrase, error)
	GetAll(ctx context.Context) ([]Phrase, error)
	Update(ctx context.Context, id string, input UpdateInput) (*Phrase, error)
	Delete(ctx context.Context, id string) error
	Search(ctx context.Context, userID int, term string) ([]Phrase, error)
	AddDetails(ctx context.Context, input CreateDetailsInput) (*PhraseDetails, error)
	GetDetails(ctx context.Context, phraseID int) (*PhraseDetails, error)
	GetAllPaginated(ctx context.Context, params PaginationParams) (*PaginatedResult[PhraseWithDetails], error)
	GetByUserIDPaginated(ctx context.Context, userID int, params PaginationParams) (*PaginatedResult[PhraseWithDetails], error)
}
