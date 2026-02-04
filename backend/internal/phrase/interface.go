package phrase

import "context"

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
}
