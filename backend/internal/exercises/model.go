package exercises

import "time"

// TipoExercicio representa uma categoria de exercício (tipos_exercicio)
type TipoExercicio struct {
	ID        int       `json:"id"`
	Nome      string    `json:"nome"`
	Descricao string    `json:"descricao,omitempty"`
	CriadoEm  time.Time `json:"criado_em"`
}

// ExercicioCatalogo representa um exercício no catálogo (exercicios_catalogo)
type ExercicioCatalogo struct {
	ID        int       `json:"id"`
	Nome      string    `json:"nome"`
	TipoID    int       `json:"tipo_id"`
	Descricao string    `json:"descricao,omitempty"`
	Ativo     bool      `json:"ativo"`
	CriadoEm  time.Time `json:"criado_em"`
}

// Exercicio representa um exercício individual (exercicios)
type Exercicio struct {
	ID             int                    `json:"id"`
	UsuarioID      *int                   `json:"usuario_id,omitempty"`
	CatalogoID     int                    `json:"catalogo_id"`
	DadosExercicio map[string]interface{} `json:"dados_exercicio"`
	Nivel          int                    `json:"nivel"`
	CriadoEm       time.Time             `json:"criado_em"`
}

// ── Response DTOs para o frontend ──────────────────────────────

// CatalogoItem junta catálogo + tipo para listagem no frontend
type CatalogoItem struct {
	ID          int    `json:"id"`
	Descricao   string `json:"descricao,omitempty"`
	Nome        string `json:"nome"`
	TipoID      int    `json:"tipo_id"`
	TipoNome    string `json:"tipo_nome"`
	Ativo       bool   `json:"ativo"`
}

// TipoComCatalogo agrupa catálogos por tipo para exibição organizada
type TipoComCatalogo struct {
	Tipo      TipoExercicio   `json:"tipo"`
	Catalogos []CatalogoItem  `json:"catalogos"`
}
