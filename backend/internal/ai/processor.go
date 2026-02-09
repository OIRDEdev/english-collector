package ai

import (
	"context"
	"log"
)

// Processor gerencia o processamento assíncrono de traduções
type Processor struct {
	translator  ServiceInterface
	storer      PhraseStorer
	broadcaster EventBroadcaster
}

// NewProcessor cria um novo processor com dependências injetadas
func NewProcessor(translator ServiceInterface, storer PhraseStorer, broadcaster EventBroadcaster) *Processor {
	return &Processor{
		translator:  translator,
		storer:      storer,
		broadcaster: broadcaster,
	}
}

// ProcessRequest representa uma requisição de tradução assíncrona
type ProcessRequest struct {
	PhraseID      int
	Conteudo      string
	IdiomaOrigem  string
	IdiomaDestino string
	Contexto      string
}

// ProcessAsync processa tradução em background (fire-and-forget)
func (p *Processor) ProcessAsync(req ProcessRequest) {
	go p.process(req)
}

// process executa a tradução e salva resultado
func (p *Processor) process(req ProcessRequest) {
	ctx := context.Background()

	// 1. Traduz via IA
	aiResponse, err := p.translator.Translate(ctx, TranslationRequest{
		ID:            req.PhraseID,
		Conteudo:      req.Conteudo,
		IdiomaOrigem:  req.IdiomaOrigem,
		IdiomaDestino: req.IdiomaDestino,
		Contexto:      req.Contexto,
	})

	if err != nil {
		log.Printf("[AI] Translation failed for phrase %d: %v", req.PhraseID, err)
		if p.broadcaster != nil {
			p.broadcaster.BroadcastError(req.PhraseID, err)
		}
		return
	}

	// 2. Salva no banco via interface injetada
	if p.storer != nil {
		err = p.storer.SaveTranslationDetails(ctx, TranslationDetailsInput{
			PhraseID:         req.PhraseID,
			TraducaoCompleta: aiResponse.TraducaoCompleta,
			Explicacao:       aiResponse.Explicacao,
			FatiasTraducoes:  aiResponse.FatiasTraducoes,
			ModeloIA:         aiResponse.ModeloIA,
		})
		if err != nil {
			log.Printf("[AI] Failed to save details for phrase %d: %v", req.PhraseID, err)
			return
		}
	}

	log.Printf("[AI] Translation saved for phrase %d", req.PhraseID)

	// 3. Notifica via SSE
	if p.broadcaster != nil {
		p.broadcaster.BroadcastTranslation(
			req.PhraseID,
			aiResponse.TraducaoCompleta,
			aiResponse.Explicacao,
			aiResponse.FatiasTraducoes,
			aiResponse.ModeloIA,
		)
	}
}
