package phrase

import (
	"encoding/base64"
	"encoding/json"
	"time"
)

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

// PhraseWithDetails para listagem com JOIN
type PhraseWithDetails struct {
	ID           int       `json:"id"`
	UsuarioID    int       `json:"usuario_id"`
	Conteudo     string    `json:"conteudo"`
	IdiomaOrigem string    `json:"idioma_origem"`
	URLOrigem    string    `json:"url_origem,omitempty"`
	TituloPagina string    `json:"titulo_pagina,omitempty"`
	CapturadoEm  time.Time `json:"capturado_em"`
	Detalhes     *Details  `json:"detalhes,omitempty"`
}

// Details embedded dentro de PhraseWithDetails
type Details struct {
	TraducaoCompleta string            `json:"traducao_completa"`
	Explicacao       string            `json:"explicacao,omitempty"`
	FatiasTraducoes  map[string]string `json:"fatias_traducoes,omitempty"`
	ModeloIA         string            `json:"modelo_ia,omitempty"`
}

// PaginationParams parâmetros de paginação
type PaginationParams struct {
	Cursor string
	Limit  int
}

// PaginatedResult resultado paginado
type PaginatedResult[T any] struct {
	Data       []T    `json:"data"`
	NextCursor string `json:"next_cursor,omitempty"`
	HasMore    bool   `json:"has_more"`
}

// Cursor representa o ponto de paginação
type Cursor struct {
	CreatedAt time.Time `json:"created_at"`
	ID        int       `json:"id"`
}

// Encode converte o cursor para string base64
func (c *Cursor) Encode() string {
	data, _ := json.Marshal(c)
	return base64.URLEncoding.EncodeToString(data)
}

// DecodeCursor converte uma string base64 para Cursor
func DecodeCursor(encoded string) (*Cursor, error) {
	if encoded == "" {
		return nil, nil
	}
	data, err := base64.URLEncoding.DecodeString(encoded)
	if err != nil {
		return nil, err
	}
	var c Cursor
	if err := json.Unmarshal(data, &c); err != nil {
		return nil, err
	}
	return &c, nil
}

// Constantes de paginação
const (
	DefaultLimit = 20
	MaxLimit     = 100
)

// NormalizeLimit garante que o limit está dentro dos limites
func NormalizeLimit(limit int) int {
	if limit <= 0 {
		return DefaultLimit
	}
	if limit > MaxLimit {
		return MaxLimit
	}
	return limit
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

