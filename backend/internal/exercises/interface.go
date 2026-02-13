package exercises

import "context"

// RepositoryInterface define as operações de acesso a dados de exercícios
type RepositoryInterface interface {
	// Tipos
	ListTipos(ctx context.Context) ([]TipoExercicio, error)

	// Catálogo
	ListCatalogo(ctx context.Context) ([]CatalogoItem, error)
	GetCatalogoByTipo(ctx context.Context, tipoID int) ([]CatalogoItem, error)

	// Exercícios individuais
	GetByID(ctx context.Context, id int) (*Exercicio, error)
	GetByCatalogoID(ctx context.Context, catalogoID int, limit int) ([]Exercicio, error)
}

// ServiceInterface define a lógica de negócio de exercícios
type ServiceInterface interface {
	// Lista tipos com seus catálogos (para a tela /exercises)
	ListTiposComCatalogo(ctx context.Context) ([]TipoComCatalogo, error)

	// Pega até N exercícios de um catálogo (quando clica num exercício)
	GetExerciciosByCatalogo(ctx context.Context, catalogoID int, limit int) ([]Exercicio, error)

	// Pega um exercício por ID
	GetByID(ctx context.Context, id int) (*Exercicio, error)
}
