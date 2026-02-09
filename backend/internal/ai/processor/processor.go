package processor

import (
	"context"
)

// Processor orquestra o pipeline de tradução
type Processor struct {
	translator *Translator
	persister  *Persister
	notifier   *Notifier
}

// New cria um novo Processor com seus componentes
func New(translator *Translator, persister *Persister, notifier *Notifier) *Processor {
	return &Processor{
		translator: translator,
		persister:  persister,
		notifier:   notifier,
	}
}

// ProcessAsync executa o pipeline em background (fire-and-forget)
func (p *Processor) ProcessAsync(req Request) {
	go p.execute(req)
}

// execute roda o pipeline: translate → persist → notify
func (p *Processor) execute(req Request) {
	ctx := context.Background()

	// Step 1: Translate
	result := p.translator.Translate(ctx, req)

	// Step 2: Handle error or persist
	if result.Error != nil {
		p.notifier.NotifyError(req.PhraseID, result.Error)
		return
	}

	// Step 3: Persist
	if err := p.persister.Save(ctx, result); err != nil {
		p.notifier.NotifyError(req.PhraseID, err)
		return
	}

	// Step 4: Notify success
	p.notifier.NotifySuccess(result)
}
