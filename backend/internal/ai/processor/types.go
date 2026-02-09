package processor

// Request representa uma requisição de tradução
type Request struct {
	PhraseID      int
	Conteudo      string
	IdiomaOrigem  string
	IdiomaDestino string
	Contexto      string
}

// Result representa o resultado de uma tradução
type Result struct {
	PhraseID         int
	TraducaoCompleta string
	Explicacao       string
	FatiasTraducoes  map[string]string
	ModeloIA         string
	Error            error
}
