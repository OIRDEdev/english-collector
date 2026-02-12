package anki

import (
	"math"
	"time"
)

// SM2Result contém o resultado do cálculo SM-2
type SM2Result struct {
	NovaFacilidade   float64
	NovoIntervalo    int
	NovasRepeticoes  int
	NovaSequencia    int
	NovoEstado       string
	ProximaRevisao   time.Time
}

// CalculateSM2 implementa o algoritmo SuperMemo SM-2 simplificado.
//
// Notas: 1=Errei, 2=Difícil, 3=Bom, 4=Fácil
//
// Se nota < 3: reset do progresso, intervalo volta para 1 dia.
// Se nota >= 3: avança o intervalo baseado na facilidade.
func CalculateSM2(facilidadeAtual float64, intervaloAtual int, repeticoesAtual int, sequenciaAtual int, nota int) SM2Result {
	var (
		novaFacilidade  = facilidadeAtual
		novoIntervalo   int
		novasRepeticoes = repeticoesAtual
		novaSequencia   = sequenciaAtual
		novoEstado      string
	)

	if nota < 3 {
		// Errou ou achou muito difícil — reset
		novoIntervalo = 1
		novasRepeticoes = 0
		novaSequencia = 0
		novoEstado = "aprendizado"
	} else {
		// Acertou (Bom ou Fácil)
		novasRepeticoes++
		novaSequencia++

		switch novasRepeticoes {
		case 1:
			novoIntervalo = 1
		case 2:
			novoIntervalo = 6
		default:
			novoIntervalo = int(math.Round(float64(intervaloAtual) * novaFacilidade))
		}

		novoEstado = "revisao"
	}

	// Ajustar facilidade (EF) — fórmula SM-2
	// EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
	// onde q é a nota (mapeada de 1-4 para 1-4)
	q := float64(nota)
	novaFacilidade += 0.1 - (5.0-q)*(0.08+(5.0-q)*0.02)

	// Facilidade mínima de 1.3
	if novaFacilidade < 1.3 {
		novaFacilidade = 1.3
	}

	proximaRevisao := time.Now().AddDate(0, 0, novoIntervalo)

	return SM2Result{
		NovaFacilidade:  math.Round(novaFacilidade*100) / 100,
		NovoIntervalo:   novoIntervalo,
		NovasRepeticoes: novasRepeticoes,
		NovaSequencia:   novaSequencia,
		NovoEstado:      novoEstado,
		ProximaRevisao:  proximaRevisao,
	}
}
