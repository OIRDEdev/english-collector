# Exercises Module - Unit Tests

Documentação dos testes unitários do módulo `exercises/repository`.

## Localização

```text
backend/internal/exercises/tests/
└── repository_test.go      # Testes do repositório core de exercícios
```

## Como Rodar

```bash
# Todos os testes do módulo exercises
go test -v -count=1 ./internal/exercises/tests/...

# Com coverage geral
go test -v -coverprofile=coverage.out -coverpkg=./internal/exercises/... ./internal/exercises/tests/...

# Ver coverage detalhado por função
go tool cover -func=coverage.out
```

## Estratégia de Mock

Assim como nos demais módulos, utilizamos `pgxmock` e a interface `DBTX` (`backend/internal/exercises/repository/repository.go`). 

Isto permitiu moldar cenários de seleção e listagem sofisticados da tabela `exercicios` sem a necessidade do banco populado.

## Cobertura Atual

A cobertura do módulo `./internal/exercises/...` é atualmente de **86.2%**.

O pacote repositório está profundamente coberto, garantindo alta estabilidade da complexa lógica de busca de exercícios de aprendizado de idiomas. O Service layer não possui cobertura própria declarada na suíte de testes.

## Testes por Arquivo

### `repository_test.go` (8 testes)

A listagem abaixo engloba a estabilidade de consultas base e a complexa rotina de triagem com chaves estrangeiras (`idiomas`, `usuarios` e exclusão de rastreio de `exercicios_visualizados`).

| Teste | Valida |
|-------|--------|
| `TestListTipos_Success` | Seleciona dados mestre `id`, `nome` de `tipos_exercicio` |
| `TestListCatalogo_Success` | Valida o catálogo macro retornando id, nome e tipo de `catalogo_exercicios` |
| `TestGetCatalogoByTipo_Success` | Filtra catálogo pelo seu FK de tipo |
| `TestGetByID_Success` | Leitura profunda da estrutura de `exercicios` (com suas foreign keys de idioma embutidas) |
| `TestGetByID_NotFound` | Falha natural em `Scan` de result set vazio |
| `TestGetByCatalogoID_Success` | Seleção de N resultados associados a um assunto de catálogo |
| **`TestGetByCatalogoAndUserLanguages_Success`** | 🟢 **Principal:** O mais complexo, validando o `INNER JOIN` em usuarios para obter `idioma_origem_id`/`idioma_aprendizado_id` simultaneamente com o filtro global (`usuario_id IS NULL`), atestando a presença do `LEFT JOIN` de rastreio (`ev.id IS NULL`). |
| `TestMarkExerciseAsViewed_Success` | `INSERT` primitivo na tracking table indicando avanço no flow diário do usuário. |
