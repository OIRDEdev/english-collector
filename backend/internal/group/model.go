package group

import "time"

type Group struct {
	ID          int       `json:"id"`
	UsuarioID   int       `json:"usuario_id"`
	NomeGrupo   string    `json:"nome_grupo"`
	Descricao   string    `json:"descricao,omitempty"`
	CorEtiqueta string    `json:"cor_etiqueta,omitempty"`
	CriadoEm    time.Time `json:"criado_em"`
}

type PhraseGroup struct {
	FraseID int `json:"frase_id"`
	GrupoID int `json:"grupo_id"`
}

type CreateInput struct {
	UsuarioID   int    `json:"usuario_id"`
	NomeGrupo   string `json:"nome_grupo"`
	Descricao   string `json:"descricao"`
	CorEtiqueta string `json:"cor_etiqueta"`
}

type UpdateInput struct {
	NomeGrupo   string `json:"nome_grupo,omitempty"`
	Descricao   string `json:"descricao,omitempty"`
	CorEtiqueta string `json:"cor_etiqueta,omitempty"`
}
