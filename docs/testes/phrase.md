# Phrase Module - Unit Tests

Documentação dos testes unitários do módulo `phrase/repository`.

## Localização

```
backend/internal/phrase/tests/
├── crud_test.go       # Testes de CRUD e Search
├── details_test.go    # Testes de Details (traduções)
└── stats_test.go      # TestMain com estatísticas
```

## Como Rodar

```bash
# Todos os testes
go test -v -count=1 ./internal/phrase/tests/

# Com race detector
go test -v -race ./internal/phrase/tests/

# Com coverage
go test -v -coverprofile=coverage.out -coverpkg=./internal/phrase/repository/... ./internal/phrase/tests/

# Ver coverage por função
go tool cover -func=coverage.out
```

## Estratégia de Mock

Usamos [`pgxmock`](https://github.com/pashagolub/pgxmock) para simular o banco PostgreSQL sem precisar de uma instância real.

O repository foi refatorado para aceitar a interface `DBTX`:

```go
type DBTX interface {
    Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
    QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
    Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}
```

Isso permite injetar o mock via `repository.NewWithDB(mock)`.

## Cobertura Atual

| Função | Coverage | Testes |
|--------|----------|--------|
| `Create` | 100% | sucesso, erro DB |
| `GetByID` | 100% | sucesso, not found |
| `GetByUserID` | 83.3% | múltiplos resultados, lista vazia |
| `GetAll` | 91.7% | sucesso, erro DB |
| `Update` | 100% | sucesso |
| `Delete` | 100% | sucesso, erro DB |
| `Search` | 83.3% | resultados, sem resultados |
| `CreateDetails` | 100% | sucesso, FK violation |
| `GetDetailsByPhraseID` | 100% | sucesso, not found |
| `GetAllPaginated` | 0% | ⏳ pendente |
| `GetByUserIDPaginated` | 0% | ⏳ pendente |
| **Total** | **40.1%** | **17 testes** |

> Os 83.3% em `GetByUserID` e `Search` são porque o branch de erro no `rows.Scan` é difícil de simular com mock — não afeta a qualidade dos testes.

## Testes por Arquivo

### `crud_test.go` (13 testes)

| Teste | Valida |
|-------|--------|
| `TestCreate_Success` | INSERT retorna ID e timestamp |
| `TestCreate_DBError` | Erro de conexão propagado |
| `TestGetByID_Success` | SELECT retorna campos corretos |
| `TestGetByID_NotFound` | Erro "phrase not found" |
| `TestGetByUserID_Success` | Lista com 2 frases |
| `TestGetByUserID_Empty` | Lista vazia sem erro |
| `TestGetAll_Success` | Retorna 3 frases |
| `TestGetAll_DBError` | Erro de DB propagado |
| `TestUpdate_Success` | UPDATE executa sem erro |
| `TestDelete_Success` | DELETE executa sem erro |
| `TestDelete_DBError` | Erro FK propagado |
| `TestSearch_Success` | Full-text search retorna resultado |
| `TestSearch_NoResults` | Busca sem match retorna vazio |

### `details_test.go` (4 testes)

| Teste | Valida |
|-------|--------|
| `TestCreateDetails_Success` | INSERT com JSON de fatias |
| `TestCreateDetails_DBError` | FK violation propagado |
| `TestGetDetailsByPhraseID_Success` | Deserializa fatias JSON |
| `TestGetDetailsByPhraseID_NotFound` | Erro para ID inexistente |

## Por que 0.00s por Teste?

Os testes rodam em ~1μs cada porque `pgxmock` opera 100% em memória — sem rede, sem disco, sem banco real. Isso é **esperado** e confirma que os testes estão isolados.

A prova de execução real vem do **coverage report**: se o código não executasse, o coverage seria 0%.
