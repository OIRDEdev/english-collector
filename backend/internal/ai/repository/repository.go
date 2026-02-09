package repository

import "context"

// TranslationDetails representa os detalhes salvos no banco
type TranslationDetails struct {
	PhraseID         int
	TraducaoCompleta string
	Explicacao       string
	FatiasTraducoes  map[string]string
	ModeloIA         string
}

// Repository interface para persistência de traduções
type Repository interface {
	Save(ctx context.Context, details TranslationDetails) error
}
