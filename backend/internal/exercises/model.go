package exercises

import "time"

// Exercicio representa um exercício da tabela exercicios
type Exercicio struct {
	ID             int                    `json:"id"`
	UsuarioID      *int                   `json:"usuario_id,omitempty"`
	TipoComponente string                 `json:"tipo_componente"`
	DadosExercicio map[string]interface{} `json:"dados_exercicio"`
	Nivel          int                    `json:"nivel"`
	Tags           []string               `json:"tags"`
	CriadoEm       time.Time              `json:"criado_em"`
}

// ExerciseGroup representa exercícios agrupados por tipo para o frontend
type ExerciseGroup struct {
	Tipo   string      `json:"tipo"`
	Origem string      `json:"origem"`
	Data   []Exercicio `json:"data"`
}
