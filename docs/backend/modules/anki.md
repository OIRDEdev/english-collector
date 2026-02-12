# Anki Module

O Anki Module implementa o sistema de **Spaced Repetition (SRS)** baseado no algoritmo **SM-2**, permitindo que usuários revisem frases capturadas com intervalos otimizados de memorização.

## Arquitetura

```
internal/anki/
├── model.go              # AnkiCard, ReviewInput, ReviewResult, SessionStats
├── interface.go           # RepositoryInterface + ServiceInterface
├── algorithm.go           # Algoritmo SM-2 (CalculateSM2)
├── repository/
│   └── repository.go     # Queries pgxpool (anki_progresso + anki_historico)
└── service/
    └── service.go        # GetDueCards, SubmitReview, GetStats
```

## Componentes

### 1. Models (`model.go`)

| Struct | Descrição |
|--------|-----------|
| `AnkiCard` | Card para revisão (JOIN anki_progresso + frases + frase_detalhes) |
| `ReviewInput` | Body do POST: `anki_id` + `nota` (1-4) |
| `ReviewResult` | Resposta: novo intervalo, facilidade, próxima revisão |
| `SessionStats` | Contadores: total, due_today, novos, aprendendo, revisão |

### 2. Algoritmo SM-2 (`algorithm.go`)

```
Nota < 3 (Errei/Difícil):
    → intervalo = 1 dia, repetições = 0, estado = "aprendizado"

Nota >= 3 (Bom/Fácil):
    → repetições == 1: intervalo = 1 dia
    → repetições == 2: intervalo = 6 dias
    → repetições > 2:  intervalo = anterior × facilidade
    → estado = "revisao"

Facilidade (EF):
    EF' = EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))
    EF mínimo = 1.3
```

### 3. Repository (`repository/repository.go`)

| Método | Query |
|--------|-------|
| `GetDueCards` | JOIN anki_progresso + frases + frase_detalhes WHERE proxima_revisao <= NOW() |
| `GetByID` | Busca card específico pelo ID |
| `UpdateProgress` | UPDATE facilidade, intervalo, repetições, estado, proxima_revisao |
| `InsertHistory` | INSERT anki_historico com nota e intervalos |
| `GetStats` | COUNT com FILTER por estado |

### 4. Service (`service/service.go`)

- `GetDueCards` → delega ao repository, retorna `[]` se nil
- `SubmitReview` → valida nota → busca card → calcula SM-2 → update + insert history
- `GetStats` → delega ao repository

## Rotas

| Rota | Método | Handler | Descrição |
|------|--------|---------|-----------|
| `/api/v1/anki/due` | GET | `GetDueCards` | Cards para revisar (`?user_id=`) |
| `/api/v1/anki/review` | POST | `SubmitReview` | Submeter revisão (`?user_id=`) |
| `/api/v1/anki/stats` | GET | `GetAnkiStats` | Estatísticas (`?user_id=`) |

## Tabelas SQL

- `anki_progresso` — estado SRS de cada frase (facilidade, intervalo, repetições, estado)
- `anki_historico` — log de cada revisão (nota, intervalo anterior/novo)

## Wiring em `main.go`

```go
ankiRepository := ankiRepo.New(db)
ankiService := ankiSvc.New(ankiRepository)
// Passado ao handlers.NewHandler(...)
```
