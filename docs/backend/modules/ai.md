# AI Module

O AI Module é responsável por integrar com serviços de IA Generativa (atualmente **Google Gemini 2.0 Flash**) para fornecer traduções e explicações para frases capturadas.

## Arquitetura

O módulo segue o padrão **Modular Monolith** com separação clara de responsabilidades:

```
internal/ai/
├── model.go                    # Tipos core e interfaces
├── service.go                  # Cliente Gemini AI
├── processor/                  # Pipeline de processamento
│   ├── types.go                # Request/Result types
│   ├── translator.go           # Executa tradução via IA
│   ├── persister.go            # Salva no banco de dados
│   ├── notifier.go             # Envia notificações SSE
│   └── processor.go            # Orquestra o pipeline
├── repository/                 # Persistência
│   ├── repository.go           # Interface Repository
│   └── phrase_adapter.go       # Adapter para phrase service
└── routing/                    # Eventos/Notificações
    ├── routing.go              # Interface Broadcaster
    └── sse_adapter.go          # Adapter para SSE hub
```

## Componentes

### 1. Service (`service.go`)

Cliente para API Gemini:
- Inicializa com `API_KEY_GEMINI`
- Método `Translate()` retorna JSON estruturado
- Sanitização de respostas markdown

### 2. Processor Pipeline

O pipeline é dividido em componentes especializados:

#### Translator (`processor/translator.go`)
```go
// Responsabilidade: APENAS traduzir
result := translator.Translate(ctx, request)
```

#### Persister (`processor/persister.go`)
```go
// Responsabilidade: APENAS salvar no banco
err := persister.Save(ctx, result)
```

#### Notifier (`processor/notifier.go`)
```go
// Responsabilidade: APENAS notificar via SSE
notifier.NotifySuccess(result)
notifier.NotifyError(phraseID, err)
```

#### Processor (`processor/processor.go`)
```go
// Responsabilidade: Orquestrar o pipeline
// translate → persist → notify
processor.ProcessAsync(request)
```

### 3. Repository (`repository/`)

Interface para persistência:
```go
type Repository interface {
    Save(ctx context.Context, details TranslationDetails) error
}
```

**PhraseAdapter** implementa a interface usando `phrase.ServiceInterface`.

### 4. Routing (`routing/`)

Interface para eventos:
```go
type Broadcaster interface {
    SendTranslation(event TranslationEvent)
    SendError(event ErrorEvent)
}
```

**SSEAdapter** implementa a interface usando `sse.Hub`.

## Wiring em `main.go`

```go
// 1. Serviço de IA
aiService, _ := ai.NewService()

// 2. Componentes do processor
translator := processor.NewTranslator(aiService)
persister := processor.NewPersister(repository.NewPhraseAdapter(phraseService))
notifier := processor.NewNotifier(routing.NewSSEAdapter(sseHub))

// 3. Montar processor
aiProcessor := processor.New(translator, persister, notifier)

// 4. Middleware
aiMiddleware = middleware.NewAIMiddleware(aiProcessor)
```

## Fluxo de Execução

```
HTTP Request
     ↓
[Middleware] → Captura request body
     ↓
[Handler] → Salva frase (resposta 2xx)
     ↓
[Middleware] → Dispara processor.ProcessAsync()
     ↓
[Translator] → Chama Gemini API
     ↓
[Persister] → Salva detalhes no banco
     ↓
[Notifier] → Broadcast via SSE
```

## Benefícios

| Aspecto | Implementação |
|---------|---------------|
| **Single Responsibility** | Cada arquivo tem uma única função |
| **Testabilidade** | Componentes mockáveis via interfaces |
| **Extensibilidade** | Novo provider = novo arquivo em `service_*.go` |
| **Manutenibilidade** | Mudanças isoladas por componente |
