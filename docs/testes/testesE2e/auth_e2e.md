# Auth E2E — Testes de Rotas de Autenticação

## Rotas Testadas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/v1/auth/login` | ❌ | Login com email/senha |
| `POST` | `/api/v1/auth/register` | ❌ | Registro de novo usuário |
| `GET` | `/api/v1/auth/me` | ✅ | Dados do usuário logado |
| `POST` | `/api/v1/auth/logout` | ✅ | Logout (limpa cookies) |

## Test Cases

### `login_success_test.go`

| Teste | Requisição | Status Esperado | Validações |
|-------|-----------|-----------------|------------|
| `TestLogin_Success` | `POST /auth/login` com credenciais válidas | `200` | Cookie `access_token` presente, body contém `id`, `nome`, `email` |

### `login_bad_input_test.go`

| Teste | Requisição | Status Esperado | Cenário |
|-------|-----------|-----------------|---------|
| `JSON_Inválido` | Body = string pura | `400` | Body não é JSON válido |
| `Email_Vazio` | `{"email": "", "senha": "..."}` | `401` | Email vazio → credenciais inválidas |
| `Senha_Errada` | `{"email": "valid", "senha": "wrong"}` | `401` | Senha incorreta |
| `Usuário_Inexistente` | `{"email": "fake@fake.com"}` | `401` | Email não existe no banco |

### `login_xss_test.go` — Testes de Segurança

| Teste | Payload XSS | Validações |
|-------|-------------|------------|
| `XSS_email_<script>` | `<script>alert('xss')</script>` no campo email | Status ≠ 200, body não reflete `<script>` |
| `XSS_email_"><img` | `"><img src=x onerror=alert(1)>` no campo email | Status ≠ 200, body não reflete `onerror=` |
| `XSS_email_SQL` | `' OR 1=1 --` no campo email | Status ≠ 200 (SQL injection não funciona) |
| `XSS_email_javascript` | `javascript:alert(document.cookie)` | Status ≠ 200 |
| `XSS_senha_*` | Mesmos payloads no campo senha | Status ≠ 200 |

**8 subtests de segurança** validando que nenhum payload XSS/SQLi é refletido no response.

### `register_success_test.go`

| Teste | Requisição | Status Esperado | Cleanup |
|-------|-----------|-----------------|---------|
| `TestRegister_Success` | `POST /auth/register` com email único | `201` | Deleta o user via `DELETE /users/{id}` |

### `register_bad_input_test.go`

| Teste | Cenário | Status Esperado |
|-------|---------|-----------------|
| `JSON_Inválido` | Body = "lixo" | `400` |
| `Email_Duplicado` | Email já cadastrado (test_runner) | `400` |

### `me_unauthorized_test.go`

| Teste | Cenário | Status Esperado |
|-------|---------|-----------------|
| `TestMe_Unauthorized` | `GET /auth/me` sem cookie | `401` |
| `TestMe_Authorized` | `GET /auth/me` com cookie válido | `200` |

### `logout_test.go`

| Teste | Cenário | Status Esperado |
|-------|---------|-----------------|
| `TestLogout_ClearsCookies` | `POST /auth/logout` autenticado | `200` |
