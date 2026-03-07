# Group Module - Unit Tests

Documentação dos testes unitários do módulo `group/repository`.

## Localização

```text
backend/internal/group/tests/
└── crud_test.go       # Testes de CRUD, associação com Phrases e buscas
```

## Como Rodar

```bash
# Todos os testes do módulo group
go test -v -count=1 ./internal/group/tests/...

# Com coverage geral
go test -v -coverprofile=coverage.out -coverpkg=./internal/group/... ./internal/group/tests/...

# Ver coverage detalhado por função
go tool cover -func=coverage.out
```

## Estratégia de Mock

Utilizamos a biblioteca `pgxmock` para simular as interações com o PostgreSQL usando uma interface `DBTX` definida localmente:

```go
type DBTX interface {
    Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
    QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
    Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}
```

Isso permite instanciar e testar o repositório (`NewWithDB(mock)`) sem depender de conexão de rede ou banco ativo.

## Cobertura Atual

A cobertura total do pacote `./internal/group/...` é de **56.0%**.

- **`repository.go`**: Excelente cobertura, com a maioria das funções testadas chegando a 100% ou 83.3% (por não conseguir simular erros específicos da função `Scan`).
- **`service.go`**: Atualmente a cobertura é de 0%, indicando a necessidade futura de criar os testes com injeção do repositório mockado.

## Testes por Arquivo

### `crud_test.go` (10 testes)

| Teste | Valida |
|-------|--------|
| `TestCreate_Success` | `INSERT` na tabela `grupos` retorna novo ID e struct populada |
| `TestGetByID_Success` | Leitura correta dos campos `id`, `usuario_id`, `nome`, `descricao` e `criado_em` |
| `TestGetByID_NotFound` | Propagação de falha quando o grupo não existe |
| `TestGetByUserID_Success` | Listagem de grupos pertencentes a um único usuário |
| `TestGetAll_Success` | Listagem genérica ordenada pelo mais recente |
| `TestUpdate_Success` | `UPDATE` nos campos permitidos (nome, descrição) via pgxmock Result |
| `TestDelete_Success` | Execução pura e simples do `DELETE` |
| `TestAddPhraseToGroup_Success` | Validação da tabela pivô `grupo_phrases` (`INSERT`) |
| `TestRemovePhraseFromGroup_Success` | Remoção do vínculo via `DELETE` na tabela `grupo_phrases` |
| `TestGetPhraseGroups_Success` | `JOIN` entre `grupos` e `grupo_phrases` permitindo extrair onde a frase x está incluída |
