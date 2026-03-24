# Users E2E — Testes de Rotas de Usuários

## Rotas Testadas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/v1/users` | ✅ | Listar todos os usuários |
| `GET` | `/api/v1/users/{id}` | ✅ | Buscar usuário por ID |
| `POST` | `/api/v1/users` | ✅ | Criar novo usuário |
| `PUT` | `/api/v1/users/{id}` | ✅ | Atualizar usuário |
| `DELETE` | `/api/v1/users/{id}` | ✅ | Deletar usuário |

## Test Cases (13 testes)

### GET `/users`

| Teste | Cenário | Status | Validações |
|-------|---------|--------|------------|
| `TestListUsers_Success` | Listar todos | `200` | Array `data` com ≥ 1 user |
| `TestListUsers_Unauthorized` | Sem cookie | `401` | Middleware bloqueia |

### GET `/users/{id}`

| Teste | Cenário | Status | Validações |
|-------|---------|--------|------------|
| `TestGetUser_Success` | `id=1` | `200` | `data.id` = 1 |
| `TestGetUser_NotFound` | `id=999999` | `404` | User não existe |
| `TestGetUser_InvalidID` | `id=abc` | `404` ou `400` | Não pode crashar |
| `TestGetUser_Unauthorized` | Sem cookie | `401` | Middleware bloqueia |

### POST `/users`

| Teste | Cenário | Status | Cleanup |
|-------|---------|--------|---------|
| `TestCreateUser_Success` | Email único com UnixNano | `201` | `DELETE /users/{id}` |
| `TestCreateUser_DuplicateEmail` | Email repetido | ≠ `201` | Cleanup do primeiro user |
| `TestCreateUser_MissingFields` | Body `{}` vazio | `500` | Não cria nada |

### PUT `/users/{id}`

| Teste | Cenário | Status | Cleanup |
|-------|---------|--------|---------|
| `TestUpdateUser_Success` | Cria user → altera `nome` | `200` | `DELETE /users/{id}` |

### DELETE `/users/{id}`

| Teste | Cenário | Status | Validações |
|-------|---------|--------|------------|
| `TestDeleteUser_Success` | Cria → deleta → verifica 404 | `200` | GET retorna 404 após delete |
| `TestDeleteUser_NotFound` | `DELETE /users/999999` | `200` | Idempotente |

### 🔒 Testes de Segurança

| Teste | Ataque | Status | Resultado |
|-------|--------|--------|-----------|
| `TestUsers_SQLInjection_InID` | `GET /users/1;DROP TABLE usuarios;--` | ≠ `200` | Router não faz match ou retorna 404 |
| `TestUsers_XSS_InName` | `nome=<script>alert('pwned')</script>` | `201` | Armazena como string, sem execução |
| `TestUsers_NegativeID` | `GET /users/-1` | `404` | Sem crash |
