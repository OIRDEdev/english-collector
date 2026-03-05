# HTTP Layer

A camada HTTP lida com requisições externas, roteamento e aplicação de middleware.

## Router (`internal/http/router.go`)

O roteador usa `go-chi`, um roteador leve e idiomático.

### Global Middleware
- `RequestID`: Tracing de requisições.
- `RealIP`: IP real do cliente (proxy-aware).
- `Logger`: Log de cada requisição.
- `Recoverer`: Recuperação de panics.
- `CORS`: Cross-Origin Resource Sharing (echo de Origin, `credentials: include`).

### API Versioning
Rotas são prefixadas com `/api/v1`.

## Mapa Completo de Rotas

### Rotas Públicas
| Método | Rota | Handler |
|--------|------|---------|
| `GET` | `/health` | `HealthCheck` |
| `GET` | `/api/v1/` | `Welcome` |
| `POST` | `/api/v1/auth/login` | `Login` |
| `POST` | `/api/v1/auth/register` | `Register` |
| `POST` | `/api/v1/auth/google` | `GoogleLogin` |
| `POST` | `/api/v1/auth/refresh` | `RefreshToken` |

### Rotas Protegidas (Auth Middleware)
| Método | Rota | Handler | Módulo |
|--------|------|---------|--------|
| `GET` | `/api/v1/auth/me` | `Me` | Auth |
| `POST` | `/api/v1/auth/logout` | `Logout` | Auth |
| `GET` | `/api/v1/phrases` | `ListPhrases` | Phrases |
| `GET` | `/api/v1/phrases/{id}` | `GetPhrase` | Phrases |
| `POST` | `/api/v1/phrases` | `CreatePhrase` | Phrases |
| `PUT` | `/api/v1/phrases/{id}` | `UpdatePhrase` | Phrases |
| `DELETE` | `/api/v1/phrases/{id}` | `DeletePhrase` | Phrases |
| `GET` | `/api/v1/users` | `ListUsers` | Users |
| `POST` | `/api/v1/users` | `CreateUser` | Users |
| `GET` | `/api/v1/users/{id}` | `GetUser` | Users |
| `PUT` | `/api/v1/users/{id}` | `UpdateUser` | Users |
| `DELETE` | `/api/v1/users/{id}` | `DeleteUser` | Users |
| `GET` | `/api/v1/settings` | `GetSettings` | Settings |
| `PUT` | `/api/v1/settings` | `UpdateSettings` | Settings |
| `POST` | `/api/v1/settings/onboarding` | `CompleteOnboarding` | Settings |
| `GET` | `/api/v1/groups` | `ListGroups` | Groups |
| `POST` | `/api/v1/groups` | `CreateGroup` | Groups |
| `GET` | `/api/v1/groups/{id}` | `GetGroup` | Groups |
| `PUT` | `/api/v1/groups/{id}` | `UpdateGroup` | Groups |
| `DELETE` | `/api/v1/groups/{id}` | `DeleteGroup` | Groups |
| `GET` | `/api/v1/anki/due` | `GetDueCards` | Anki |
| `POST` | `/api/v1/anki/review` | `SubmitReview` | Anki |
| `GET` | `/api/v1/anki/stats` | `GetAnkiStats` | Anki |
| `GET` | `/api/v1/exercises` | `ListExercises` | Exercises |
| `GET` | `/api/v1/exercises/catalogo/{catalogoId}` | `GetExercisesByCatalogo` | Exercises |
| `GET` | `/api/v1/exercises/{id}` | `GetExercise` | Exercises |
| `POST` | `/api/v1/exercises/{id}/view` | `MarkExerciseAsViewed` | Exercises |
| `POST` | `/api/v1/exercises/chain/next-word` | `ChainNextWord` | Exercises |

### SSE (Server-Sent Events)
| Método | Rota | Handler | Auth |
|--------|------|---------|------|
| `GET` | `/api/v1/sse/translations` | `sseHub.Handler()` | Cookie (extrai UserID internamente) |

## Middleware

### 1. Auth Middleware (`middleware/auth.go`)
Lê o JWT de duas fontes (em ordem):
1. **Cookie `access_token`** (browser/extension)
2. **Header `Authorization: Bearer ...`** (API clients)

Injeta `*user.TokenClaims` (`UserID`, `Email`) no context via `GetUserFromContext()`.

### 2. AI Middleware (`middleware/ia_middleware.go`)
Intercepta `POST /phrases` e `PUT /phrases/{id}`.
- **Conceito**: "Fire and Forget" — captura a response, e dispara tradução AI em background se OK.
- Envia resultado via SSE ao concluir.

### 3. CORS Middleware (`middleware/cors.go`)
- Echo do header `Origin` (necessário para `credentials: include`).
- **Não** usa `Access-Control-Allow-Origin: *`.
- `Access-Control-Allow-Credentials: true`.

### 4. Cache Middleware (`cache/`)
- Rotas GET de `phrases`, `users`, `groups` podem ter cache via Redis (se configurado).
- Mutations (`POST`, `PUT`, `DELETE`) invalidam o cache (`InvalidateOn`).

## Handlers (`internal/http/handlers/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `handler.go` | Struct `Handler` + construtor com injeção de dependência de todos os services |
| `exercise.go` | `ListExercises`, `GetExercise`, `GetExercisesByCatalogo`, `MarkExerciseAsViewed` |
| `chain.go` | `ChainNextWord` (IA co-op sentence) |
| `phrase.go` | CRUD de frases |
| `user.go` | CRUD de usuários |
| `group.go` | CRUD de grupos |
| `anki.go` | Anki SRS (due, review, stats) |

### Handler Struct
```go
type Handler struct {
    userService     user.ServiceInterface
    phraseService   phrase.ServiceInterface
    groupService    group.ServiceInterface
    tokenService    *user.TokenService
    ankiService     anki.ServiceInterface
    exerciseService exercises.ServiceInterface
    aiService       *ai.Service
}
```
