# AI Module

O AI Module é responsável por integrar com serviços de IA Generativa (atualmente **Google Gemini 2.0 Flash**) para fornecer traduções e explicações para frases capturadas.

## Arquitetura Modular

O módulo AI segue o padrão **Modular Monolith**, sendo completamente independente dos outros módulos. Toda a lógica de orquestração de tradução fica dentro do módulo, e dependências externas são injetadas via interfaces.

```
internal/ai/
├── interface.go       # Interfaces para dependências externas
├── model.go           # Tipos de request/response
├── service.go         # Cliente Gemini AI
├── processor.go       # Orquestrador de tradução assíncrona
├── adapter_phrase.go  # Adapter para phrase.ServiceInterface
└── adapter_sse.go     # Adapter para sse.Hub
```

## Componentes

### 1. Interfaces (`interface.go`)

Define contratos para dependências externas:

```go
// ServiceInterface - contrato do tradutor
type ServiceInterface interface {
    Translate(ctx context.Context, req TranslationRequest) (*TranslationResponse, error)
}

// PhraseStorer - para salvar traduções (implementado por phrase module)
type PhraseStorer interface {
    SaveTranslationDetails(ctx context.Context, input TranslationDetailsInput) error
}

// EventBroadcaster - para notificações em tempo real (implementado por SSE)
type EventBroadcaster interface {
    BroadcastTranslation(phraseID int, translation, explanation string, slices map[string]string, model string)
    BroadcastError(phraseID int, err error)
}
```

### 2. Service (`service.go`)

Wrapper ao redor do cliente `genai` que:
- Inicializa com API Key (`API_KEY_GEMINI`)
- Fornece método `Translate` que retorna JSON estruturado
- Sanitiza respostas para remover markdown

### 3. Processor (`processor.go`)

Orquestrador principal que:
- Recebe requisições de tradução via `ProcessAsync`
- Executa tradução em Goroutine (fire-and-forget)
- Salva resultado via `PhraseStorer`
- Notifica clientes via `EventBroadcaster`

```go
// Uso
processor := ai.NewProcessor(translator, storer, broadcaster)
processor.ProcessAsync(ai.ProcessRequest{
    PhraseID: 123,
    Conteudo: "Hello world",
    // ...
})
```

### 4. Adapters

Conectam interfaces do módulo AI às implementações concretas:

- **`PhraseStorerAdapter`**: Adapta `phrase.ServiceInterface` → `ai.PhraseStorer`
- **`SSEBroadcasterAdapter`**: Adapta `sse.Hub` → `ai.EventBroadcaster`

## Wiring em `main.go`

```go
// 1. Criar serviço de IA
aiService, _ := ai.NewService()

// 2. Criar adapters
phraseStorer := ai.NewPhraseStorerAdapter(phraseService)
sseBroadcaster := ai.NewSSEBroadcasterAdapter(sseHub)

// 3. Criar processor com dependências injetadas
aiProcessor := ai.NewProcessor(aiService, phraseStorer, sseBroadcaster)

// 4. Criar middleware
aiMiddleware = middleware.NewAIMiddleware(aiProcessor)
```

## Middleware (`ia_middleware.go`)

O middleware HTTP agora é **mínimo**:
- Captura request body
- Executa handler original
- Se sucesso, chama `processor.ProcessAsync()`

Toda a lógica de tradução, salvamento e notificação está no módulo AI.

## Benefícios

| Antes | Depois |
|-------|--------|
| Middleware acoplado a `phrase.Service` e `sse.Hub` | Middleware só conhece `ai.Processor` |
| Lógica espalhada | Lógica centralizada em `processor.go` |
| Difícil testar | Interfaces mockáveis |
| Mudanças afetam múltiplos arquivos | Mudanças isoladas no módulo AI |

## Extensibilidade

Para adicionar novo provider de IA:
1. Criar `service_openai.go` implementando `ServiceInterface`
2. Injetar no `Processor`
3. Zero mudanças no middleware ou outros módulos
