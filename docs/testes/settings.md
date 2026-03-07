# Settings Module - Unit Tests

Documentação dos testes unitários do módulo `settings` (Repository e Service).

## Localização

```text
backend/internal/settings/
├── repository/tests/repository_test.go  # Testes de operações de DB (Upsert, Get, Updates)
└── tests/service_test.go                # Testes de regras de negócio e Onboarding
```

## Como Rodar

```bash
# Todos os testes do módulo settings
go test -v -count=1 ./internal/settings/tests/... ./internal/settings/repository/tests/...

# Com coverage geral
go test -v -coverprofile=settings_coverage.out -coverpkg=./internal/settings/... ./internal/settings/tests/... ./internal/settings/repository/tests/...

# Ver coverage detalhado por função
go tool cover -func=settings_coverage.out
```

## Estratégia de Mock

Utilizamos a biblioteca `pgxmock` para simular o banco de dados. O `Repository` foi refatorado para aceitar uma interface local `DBTX` ao invés da tipagem engessada do `pgxpool.Pool`:

```go
type DBTX interface {
    Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
    QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
    Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}
```

Isso nos permite passar o `mock` fornecido pela extensão `pgxmock` direto ao construtor do repositório, garantindo testes independentes e execução na ordem de \~milissegundos.

## Cobertura Atual

A cobertura geral do módulo é consolidada em **49.2%** por conta dos `handlers` (API Web) nativamente não testados.

Porém, as esferas modeladas pela abstração `DBTX` contam com altíssima blindagem, detalhada como:

### `repository` (~81.0% de cobertura)
- `GetByUserID`: 90.9%
- `Upsert`: 92.3%
- `UpdateUserLanguages`: 71.4%
- `UpdateConfig`: 70.0%

### `service` (~76.0% de cobertura excluindo handlers)
- `GetSettings`: 100%
- `UpdateSettings`: 69.2% (Cobriu as avaliações de ponteiros nil)
- `CompleteOnboarding`: 62.5%

## Testes por Arquivo

### `repository_test.go` (6 testes)

Foco em validar a formatação das queries e a aderência das structs aos resultados do `Scan`.
| Teste | Valida |
|-------|--------|
| `TestGetByUserID_Success` | Deserialização correta da `struct` e extração de chaves flexíveis (`configJSON`). |
| `TestGetByUserID_NotFound` | Retorno adequado de erro caso o usuário não possua preferências base. |
| `TestUpsert_Insert_Success` | O comportamento de subquery (`SELECT id...` vazio => Transição para `INSERT`). |
| `TestUpsert_Update_Success` | O comportamento de subquery (`SELECT id...` retorna ID => Transição para `UPDATE`). |
| `TestUpdateUserLanguages_Success` | Envio de comando `UPDATE` simples para a tabela primária de `usuarios` sincronizando os IDs. |
| `TestUpdateConfig_Success` | Merge no PostgreSQL do payload JSONB: `COALESCE(config, '{}'::jsonb) \|\| $1::jsonb`. |

### `service_test.go` (4 testes)

Foco no mapeamento de lógicas complexas, injetando o próprio mock como fundação.
| Teste | Valida |
|-------|--------|
| `TestService_GetSettings_Success` | Captação comum e roteamento de payload da DB para o controller. |
| `TestService_GetSettings_ReturnsDefaultsIfNotFound` | Injeção da default struct customizada caso a DB levante falha de NotFound. Evita travamentos no frontend. |
| `TestService_UpdateSettings_Success` | Garantia de Partial Updates — avaliação dos pointeiros e trigger isolado da rotina de linguagem (`UpdateUserLanguages` externa). |
| `TestService_CompleteOnboarding_Success` | O fluxo de onboarding nativo: mescla o vínculo de idiomas da tabela usuário com inserções iniciais em `preferencias_usuario`. |
