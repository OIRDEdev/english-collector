# Anki Module - Unit Tests

Documentação dos testes unitários do sistema de repetição espaçada (SRS).

## Localização

```text
backend/internal/anki/
├── repository/tests/repository_test.go  # Valida os complexos JOINs, UPDATES e buscas via PGXMOCK
├── service/tests/service_test.go        # Simula revisões, mesclando DBTX e o LogSM2
└── tests/algorithm_test.go              # Lógica pura matématica do protocolo derivado SM-2
```

## Como Rodar

```bash
# Todos os testes do módulo anki
go test -v -count=1 ./internal/anki/tests/... ./internal/anki/repository/tests/... ./internal/anki/service/tests/...

# Com coverage geral
go test -v -coverprofile=anki_coverage.out -coverpkg=./internal/anki/... ./internal/anki/tests/... ./internal/anki/repository/tests/... ./internal/anki/service/tests/...

# Ver coverage detalhado por função
go tool cover -func=anki_coverage.out
```

## Estratégia de Mock

Pela sua enorme interdependência de banco, abstraímos a persistência usando o modelo `DBTX`, da mesma forma que em `group`, `user`, etc. 

O arquivo `algorithm_test.go`, no entanto, atua com zero mocks operacionais por testar estritamente cálculos paramétricos da engine do SuperMemo.

## Cobertura Atual

O ecossistema Anki possui uma cobertura de código blindada em **86.4%**.

A maioria das operações essenciais atingem quase 100% de linha coberta:
- **`algorithm.go`**: ~89.5% (Testes isolados da fórmula EF e cálculos de intervalo).
- **`repository.go`**: ~88% a 100% (Leituras com `JOIN` da tabela de `frases` vs `anki_progresso`).
- **`service.go`**: ~76% a 83% (Cobre chamadas de ponte conectando Request do Frontend -> SM2 -> INSERT no Banco).

## Testes por Arquivo

### `repository_test.go` (5 testes)

Foco em validar conversões JSON da query avançada para o banco.
| Teste | Valida |
|-------|--------|
| `TestGetDueCards_Success` | `LEFT JOIN` que devolve as frases e `fatias_traducoes` agendadas para agora. |
| `TestGetByID_Success` & `NotFound` | Leitura padrão do ID no PostgreSQL. |
| `TestUpdateProgress_Success` | A rotação massiva de dados do Anki: `facilidade`, `intervalo`, `repeticoes`, e `proxima_revisao`. |
| `TestInsertHistory_Success` | Operação do log financeiro/histórico de estudo dos cards. |
| `TestGetStats_Success` | Sumarização avançada usando `COUNT(*) FILTER (...)` nativa do banco. |

### `service_test.go` (4 testes)

Valida as transições de ciclo de vida completas do sistema:
| Teste | Valida |
|-------|--------|
| `TestService_SubmitReview_Success` | Processo completo de responder card: Puxar do banco -> Submeter ao SM2 -> Persistir Update -> Inserir History. Requer simulações sequenciais rigorosas. |
| `TestService_SubmitReview_InvalidNota` | Bloqueio de submissão `nota < 1` ou `nota > 4`. |
| `TestService_GetStats_Success` / `GetDueCards_Success` | Proxies simples repassando saídas limpas. |

### `algorithm_test.go` (3 testes)

O cérebro da engine:
| Teste | Valida |
|-------|--------|
| `TestCalculateSM2_Failures` | Errar destrói as repetições (voltam a 0), intervalo decai a 1, Facilidade baixa consideravelmente. |
| `TestCalculateSM2_Hard` | Nota 3 avança a repetição, estagna razoavelmente a facilidade e calcula o intervalo sobre `EF`. |
| `TestCalculateSM2_Easy` | Nota 4 estipula a bonificação massiva do `Intervalo * EF` para empurrar o card pro infinito, impedindo sobrecarga e marcando com `revisao`. |
