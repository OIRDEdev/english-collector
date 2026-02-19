package repository

// Client representa um cliente SSE conectado, vinculado a um usuário
type Client struct {
	ID      string
	UserID  int
	Channel chan Event
}

// Event representa um evento SSE
type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// TranslationPayload payload de evento de tradução
type TranslationPayload struct {
	PhraseID         int               `json:"phrase_id"`
	TraducaoCompleta string            `json:"traducao_completa"`
	Explicacao       string            `json:"explicacao"`
	FatiasTraducoes  map[string]string `json:"fatias_traducoes"`
	ModeloIA         string            `json:"modelo_ia"`
}
