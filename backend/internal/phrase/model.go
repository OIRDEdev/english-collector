package phrase

import "time"

type Phrase struct {
	ID           int       `json:"id"`
	UsuarioID    int       `json:"usuario_id"`
	Conteudo     string    `json:"conteudo"`
	IdiomaOrigem string    `json:"idioma_origem"`
	URLOrigem    string    `json:"url_origem,omitempty"`
	TituloPagina string    `json:"titulo_pagina,omitempty"`
	Contexto     string    `json:"contexto,omitempty"`
	CapturadoEm  time.Time `json:"capturado_em"`
}

type PhraseDetails struct {
	ID               int               `json:"id"`
	FraseID          int               `json:"frase_id"`
	TraducaoCompleta string            `json:"traducao_completa"`
	Explicacao       string            `json:"explicacao,omitempty"`
	FatiasTraducoes  map[string]string `json:"fatias_traducoes,omitempty"`
	ModeloIA         string            `json:"modelo_ia,omitempty"`
	ProcessadoEm     time.Time         `json:"processado_em"`
}

type CreateInput struct {
	UsuarioID    int    `json:"usuario_id"`
	Conteudo     string `json:"conteudo"`
	IdiomaOrigem string `json:"idioma_origem"`
	URLOrigem    string `json:"url_origem"`
	TituloPagina string `json:"titulo_pagina"`
	Contexto     string `json:"contexto"`
}

type UpdateInput struct {
	Conteudo     string `json:"conteudo,omitempty"`
	IdiomaOrigem string `json:"idioma_origem,omitempty"`
	Contexto     string `json:"contexto,omitempty"`
}

type CreateDetailsInput struct {
	FraseID          int               `json:"frase_id"`
	TraducaoCompleta string            `json:"traducao_completa"`
	Explicacao       string            `json:"explicacao"`
	FatiasTraducoes  map[string]string `json:"fatias_traducoes"`
	ModeloIA         string            `json:"modelo_ia"`
}
