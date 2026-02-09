package ai

import "context"

// TranslationRequest representa a requisição de tradução
type TranslationRequest struct {
	ID            int    `json:"id"`
	Conteudo      string `json:"conteudo"`
	IdiomaOrigem  string `json:"idioma_origem"`
	IdiomaDestino string `json:"idioma_destino"`
	Contexto      string `json:"contexto"`
}

// TranslationResponse representa a resposta da IA
type TranslationResponse struct {
	ID               int               `json:"id"`
	TraducaoCompleta string            `json:"traducao_completa"`
	Explicacao       string            `json:"explicacao"`
	FatiasTraducoes  map[string]string `json:"fatias_traducoes"`
	ModeloIA         string            `json:"modelo_ia"`
}

// TranslatorService interface para tradução
type TranslatorService interface {
	Translate(ctx context.Context, req TranslationRequest) (*TranslationResponse, error)
}

// ResponseFormat é o formato JSON esperado da IA
const ResponseFormat = `{
  "id": <número inteiro do ID recebido>,
  "traducao_completa": "<tradução completa da frase>",
  "explicacao": "<explicação gramatical breve>",
  "fatias_traducoes": {
    "<parte original 1>": "<tradução 1>",
    "<parte original 2>": "<tradução 2>"
  }
}`
