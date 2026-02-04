package group

import "context"

type ServiceInterface interface {
	Create(ctx context.Context, input CreateInput) (*Group, error)
	GetByID(ctx context.Context, id string) (*Group, error)
	GetByUserID(ctx context.Context, userID int) ([]Group, error)
	GetAll(ctx context.Context) ([]Group, error)
	Update(ctx context.Context, id string, input UpdateInput) (*Group, error)
	Delete(ctx context.Context, id string) error
	AddPhrase(ctx context.Context, phraseID, groupID int) error
	RemovePhrase(ctx context.Context, phraseID, groupID int) error
	GetPhraseGroups(ctx context.Context, phraseID int) ([]Group, error)
}
