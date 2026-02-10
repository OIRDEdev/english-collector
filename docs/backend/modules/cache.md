# Cache Module

O Cache Module fornece uma camada de caching HTTP usando **Redis** para melhorar a performance das rotas de leitura (GET).

## Arquitetura

O módulo é independente e se integra como middleware HTTP — nenhum outro módulo precisa saber que caching existe.

```
internal/cache/
├── client.go         # Redis client wrapper
├── config.go         # TTL constants
├── middleware.go      # HTTP middleware (cache HIT/MISS)
└── invalidation.go    # Invalidação automática em mutações
```

## Componentes

### 1. Client (`client.go`)

Wrapper ao redor do `go-redis` com operações:

| Método | Descrição |
|--------|-----------|
| `Get(ctx, key)` | Busca valor do cache |
| `Set(ctx, key, value, ttl)` | Armazena com TTL |
| `Delete(ctx, keys...)` | Remove chave(s) específica(s) |
| `DeleteByPattern(ctx, pattern)` | Remove chaves por glob pattern |

**Configuração via env vars:**
- `REDIS_URL` (default: `localhost:6379`)
- `REDIS_PASSWORD` (opcional)

### 2. Middleware (`middleware.go`)

Intercepta requisições GET:

```
Request GET /api/v1/phrases
        ↓
   [Cache HIT?]──sim──→ Retorna do Redis (X-Cache: HIT)
        ↓ não
   [Handler executa]
        ↓
   [Armazena resposta no Redis]
        ↓
   Retorna resposta (X-Cache: MISS)
```

- Chave de cache: `cache:{prefix}:{hash(path+query)}`
- Só cacheia respostas 2xx
- Header `X-Cache: HIT/MISS` para debug

### 3. Invalidação (`invalidation.go`)

Middleware que limpa cache automaticamente após mutações:
- Intercepta `POST`, `PUT`, `DELETE`
- Remove chaves por padrão glob (ex: `cache:phrases:*`)
- Executa em background (não bloqueia a resposta)

### 4. Config (`config.go`)

TTLs pré-definidos:

| Constante | Valor | Uso |
|-----------|-------|-----|
| `DefaultTTL` | 5 min | Listagens gerais |
| `ShortTTL` | 1 min | Dados voláteis |
| `LongTTL` | 15 min | Dados estáveis |

## Rotas Cacheadas

| Rota | Prefix | TTL |
|------|--------|-----|
| `GET /api/v1/phrases` | `phrases` | 5 min |
| `GET /api/v1/phrases/{id}` | `phrases` | 5 min |
| `GET /api/v1/users` | `users` | 5 min |
| `GET /api/v1/groups` | `groups` | 5 min |

## Invalidação Automática

| Mutação | Pattern Invalidado |
|---------|-------------------|
| `POST /phrases` | `cache:phrases:*` |
| `PUT /phrases/{id}` | `cache:phrases:*` |

## Graceful Degradation

Se o Redis não estiver disponível:
- A aplicação inicia normalmente sem cache
- Nenhum erro é propagado para o usuário
- Log de warning é emitido no startup

## Wiring em `main.go`

```go
// Inicializa Redis (opcional)
cacheClient, err := cache.New()
if err != nil {
    log.Printf("Warning: Redis cache not available: %v", err)
}

// Passa para o router
apphttp.RegisterRoutes(r, handler, aiMiddleware, sseHub, cacheClient)
```

## Uso no Router

```go
// Cache em GET
r.With(cacheClient.Middleware("phrases", cache.DefaultTTL)).Get("/", h.ListPhrases)

// Invalidação em mutações
r.With(cacheClient.InvalidateOn("cache:phrases:*")).Post("/", h.CreatePhrase)
```
