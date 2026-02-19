# Authentication Module (`internal/auth`)

## Visão Geral
Este módulo gerencia a autenticação de usuários, integrando login tradicional (email/senha) e login social (Google). Utiliza **JWT (JSON Web Tokens)** armazenados em **HttpOnly Cookies** para segurança aprimorada contra ataques XSS.

## Estrutura do Código

O módulo está localizado em `backend/internal/auth` e se comunica com o módulo `user`.

- **`handler.go`**: 
    - Camada de transporte HTTP.
    - Gerencia cookies (`access_token`, `refresh_token`) com `HttpOnly`, `SameSite=Lax`.
    - Login e Register retornam dados do usuário (`{id, nome, email}`) no body.
    - `/me` implementado: extrai `UserID` do context (via middleware) e busca o usuário no banco.

- **`service.go`**:
    - Lógica de negócio: delega para `user.ServiceInterface`.
    - `GoogleLogin`: valida ID Token do Google via tokeninfo endpoint, registra ou loga.

## Middleware (`internal/http/middleware`)

### Auth Middleware (`auth.go`)
O middleware de autenticação lê o JWT de **duas fontes**, em ordem:

1. **Cookie `access_token`** (prioridade — browser/extension)
2. **Header `Authorization: Bearer ...`** (fallback — API clients, Postman)

Se nenhum token for encontrado → `401 Unauthorized`.
Se o token for inválido/expirado → `401 Unauthorized`.

Após validação, injeta `*user.TokenClaims` (`UserID`, `Email`) no context:

```go
claims := middleware.GetUserFromContext(r.Context())
// claims.UserID, claims.Email
```

### CORS Middleware (`cors.go`)
- Faz echo do header `Origin` (necessário para `credentials: include`).
- **Não** usa `Access-Control-Allow-Origin: *` (incompatível com cookies).
- Headers permitidos: `Content-Type`, `Authorization`, `X-Requested-With`.
- `Access-Control-Allow-Credentials: true`.

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/auth/login` | ❌ | Login com email/senha → Set-Cookie + `{id, nome, email}` |
| `POST` | `/auth/register` | ❌ | Registro → Set-Cookie + `{id, nome, email}` |
| `POST` | `/auth/google` | ❌ | Login via Google ID Token → Set-Cookie |
| `POST` | `/auth/refresh` | ❌ | Renova tokens via cookie `refresh_token` |
| `GET` | `/auth/me` | ✅ | Retorna dados do usuário logado |
| `POST` | `/auth/logout` | ✅ | Limpa cookies |

## Rotas Protegidas

O router aplica `middleware.Auth(tokenService)` nas seguintes rotas:

| Grupo | Rotas |
|-------|-------|
| Auth (protegidas) | `/auth/me`, `/auth/logout` |
| Phrases | `/phrases/*` |
| Users | `/users/*` |
| Settings | `/settings/*` |
| Groups | `/groups/*` |
| Anki | `/anki/*` |
| Exercises | `/exercises/*` |

**Rotas públicas**: `/health`, `/auth/login`, `/auth/register`, `/auth/google`, `/auth/refresh`.

## Fluxos de Autenticação

### 1. Login & Registro
1. Frontend envia `{email, senha}` via JSON.
2. Backend valida credenciais (bcrypt hash).
3. Backend gera par de tokens (Access JWT 1h + Refresh opaque 7d).
4. Grava Refresh Token no banco com **IP** e **User-Agent** (fingerprint).
5. Set-Cookie: `access_token` e `refresh_token` (HttpOnly).
6. Retorna `{id, nome, email}` no body.

### 2. Login Social (Google)
1. Frontend obtém `credential` (ID Token) via Google Sign-In.
2. Backend valida via `oauth2.googleapis.com/tokeninfo`.
3. Se email existe → login forçado (sem senha). Se não → registra com senha aleatória.
4. Set-Cookie como no fluxo tradicional.

### 3. Renovação de Token
1. Frontend recebe `401 Unauthorized`.
2. Interceptor chama `POST /auth/refresh`.
3. Browser envia cookie `refresh_token` automaticamente.
4. Backend valida o token + fingerprint (IP + User-Agent).
    - **Match**: Novo par de tokens gerado, cookies atualizados.
    - **Mismatch**: Token revogado, `401` (possível hijacking).

### 4. Checagem de Sessão (`/me`)
1. Extension/Frontend chama `GET /auth/me` com `credentials: 'include'`.
2. Middleware lê cookie `access_token` → valida JWT → injeta `UserID` no context.
3. Handler busca `User` no banco via `GetByID(userID)`.
4. Retorna `{id, nome, email}`.

## SSE e Autenticação

O SSE Hub (`internal/sse/hub.go`) extrai o `UserID` de duas formas:
1. **Cookie `access_token`**: Valida JWT e extrai `UserID` (produção).
2. **Query param `?user_id=N`**: Fallback para desenvolvimento/testes com curl.

O Hub recebe `*user.TokenService` via injeção de dependência em `NewHub(tokenService)`.

## Análise de Vulnerabilidades

| Vetor | Risco | Mitigação |
|-------|-------|-----------|
| XSS | Baixo | Tokens em cookies `HttpOnly` — JS não acessa |
| CSRF | Médio | `SameSite=Lax` bloqueia POSTs cross-site |
| Session Hijacking | Baixo | Fingerprint (IP + User-Agent) no refresh |
| Brute Force | Alto | **Pendente** — implementar rate limiting |

## Melhorias Pendentes

1. **Rate Limiting**: Adicionar nas rotas `/login` e `/refresh`.
2. **Google Password**: Usar `crypto/rand` em vez de `time.Now().String()`.
3. **Logout Revocation**: Revogar refresh token no banco ao fazer logout.
4. **Cookie `Secure`**: Setar `Secure: true` em produção (HTTPS).
5. **Refresh Token Path**: Restringir para `/api/v1/auth/refresh`.
6. **HTTP Client Timeout**: Adicionar timeout no `verifyGoogleToken`.

## Curl Tests

```bash
# Register
curl -c cookies.txt -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test","email":"test@test.com","senha":"123456"}'

# Login
curl -c cookies.txt -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","senha":"123456"}'

# /me (cookie auth)
curl -b cookies.txt http://localhost:8080/api/v1/auth/me

# Protected route
curl -b cookies.txt http://localhost:8080/api/v1/phrases

# SSE (cookie auth)
curl -b cookies.txt -N http://localhost:8080/api/v1/sse/translations

# Logout
curl -b cookies.txt -X POST http://localhost:8080/api/v1/auth/logout

# No auth → 401
curl http://localhost:8080/api/v1/phrases
```
