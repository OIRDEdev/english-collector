package anki

import "time"

// AnkiCard representa um card para revisão (JOIN anki_progresso + frases + frase_detalhes)
type AnkiCard struct {
	ID               int               `json:"id"`
	FraseID          int               `json:"frase_id"`
	Conteudo         string            `json:"conteudo"`
	TraducaoCompleta string            `json:"traducao_completa"`
	FatiasTraducoes  map[string]string `json:"fatias_traducoes,omitempty"`
	Facilidade       float64           `json:"facilidade"`
	Intervalo        int               `json:"intervalo"`
	Repeticoes       int               `json:"repeticoes"`
	SequenciaAcertos int               `json:"sequencia_acertos"`
	Estado           string            `json:"estado"`
	ProximaRevisao   time.Time         `json:"proxima_revisao"`
}

// ReviewInput é o body do POST /anki/review
type ReviewInput struct {
	AnkiID int `json:"anki_id"`
	Nota   int `json:"nota"` // 1=Errei, 2=Difícil, 3=Bom, 4=Fácil
}

// ReviewResult é a resposta após submeter uma revisão
type ReviewResult struct {
	NovoIntervalo  int     `json:"novo_intervalo"`
	NovaFacilidade float64 `json:"nova_facilidade"`
	ProximaRevisao string  `json:"proxima_revisao"`
	Estado         string  `json:"estado"`
}

// SessionStats estatísticas da sessão do usuário
type SessionStats struct {
	TotalCards int `json:"total_cards"`
	DueToday   int `json:"due_today"`
	Novos      int `json:"novos"`
	Aprendendo int `json:"aprendendo"`
	Revisao    int `json:"revisao"`
}
