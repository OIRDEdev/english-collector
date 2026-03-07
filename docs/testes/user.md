# User Module - Unit Tests

Documentação dos testes unitários do módulo `user` (Service, Repository e RefreshTokenRepository).

## Localização

```
backend/internal/user/tests/
├── repository_test.go                  # Testes do Repository (CRUD usuários)
├── refresh_token_repository_test.go    # Testes do RefreshTokenRepository (Gerenciamento de tokens)
└── service_test.go                     # Testes do Service (Regras de negócio e Autenticação)
```

## Como Rodar

```bash
# Todos os testes do módulo user
go test -v -count=1 ./internal/user/tests/...

# Com coverage geral
go test -v -coverprofile=coverage.out -coverpkg=./internal/user/... ./internal/user/tests/...

# Ver coverage detalhado por função
go tool cover -func=coverage.out
```

## Estratégia de Mock

Utilizamos a biblioteca `pgxmock` para simular as interações com o banco de dados PostgreSQL. Para isso, refatoramos as estruturas de repositório para aceitar uma interface `DBTX`, definida localmente no pacote `user`:

```go
type DBTX interface {
    Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
    QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
    Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}
```

Isso permite inicializar o repositório nos testes da seguinte forma:
```go
mock, _ := pgxmock.NewPool()
repo := user.NewRepository(mock)
```

## Cobertura Atual

O módulo alcançou uma cobertura inicial de **~65.1%** focando nos fluxos críticos de autenticação e persistência.

### `refreshTokenRepo` (100% de cobertura nas funções testadas)
Ponto focal de segurança no gerenciamento de sessões prolongadas. Funções como `GetByToken`, `Create`, `Revoke`, `RevokeAllForUser` e `CleanExpired` estão todas cobertas contra sucesso e falhas de DB/tokens expirados.

### `userRepo` (100% nas principais queries)
Garante a integridade do CRUD da tabela `usuarios`.
- `Create`, `GetByID`, `GetByEmail`, `Update`, `Delete`, `UpdateExtensionToken` estão integralmente cobertos.
- `GetAll` iterando sobre múltiplos resultados usando mock.

### `userService` (Foco em Autenticação)
O Service é fortemente acoplado aos repositórios. Como já os mockamos, a injeção nas instâncias de `Service` permite simular cenários de negócio complexos:
- Fluxos de Registro (`Register` com sucesso e falha por email existente).
- Fluxos de Login (`Login` checando senhas hasheadas contra entradas simuladas).
- Fluxo de Refresh (`RefreshTokens` validando tokens válidos, IP matching para mitigação de hijacking e revogação de tokens comprometidos).

## Testes por Arquivo

### `repository_test.go`
- Valida INSERT e retorno via `RETURNING`.
- Valida as extrações do JOIN implícito nas leituras de Foreign Keys (`idioma_origem_id` e `idioma_aprendizado_id`).
- Garante o comportamento correto de UPDATE e DELETE.

### `refresh_token_repository_test.go`
- Verifica queries filtrando com construções complexas de data (`expira_em > NOW()`).
- Assegura manipulação de campos booleanos (`revogado`).

### `service_test.go`
- Valida cenários do mundo real (Geração de `AuthTokens`, hashing com `bcrypt`, verificação de fingerprints como IP/UserAgent).
- Simula respostas de erro vindas da camada de DB (ex: "user not found" desencadeando erro de credenciais inválidas) de forma a garantir que mensagens sensíveis de banco não vazem ao cliente.
