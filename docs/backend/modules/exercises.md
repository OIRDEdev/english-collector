# Exercises Module

O Exercises Module gerencia exercícios polimórficos armazenados com tipo + payload JSONB, permitindo diferentes estruturas de dados para cada tipo de exercício.

## Arquitetura

```
internal/exercises/
├── model.go              # Exercicio, ExerciseGroup
├── interface.go           # RepositoryInterface + ServiceInterface
├── repository/
│   └── repository.go     # Queries pgxpool (exercicios)
└── service/
    └── service.go        # ListGrouped, GetByType, GetByID + mapeamento de tipos
```

## Componentes

### 1. Models (`model.go`)

| Struct | Descrição |
|--------|-----------|
| `Exercicio` | Exercício com `dados_exercicio` JSONB polimórfico |
| `ExerciseGroup` | Agrupamento por tipo para envio ao frontend |

### 2. JSONB Polimórfico

O campo `dados_exercicio` contém payloads diferentes conforme o `tipo_componente`:

| tipo_componente | Payload JSONB |
|-----------------|---------------|
| `ClaritySprint` | `{instrucao, texto_completo, palavras_erradas, tempo_limite}` |
| `EchoWrite` | `{instrucao, texto_total, parte_oculta, texto_lacunado, audio_url}` |
| `NexusConnect` | `{instrucao, palavra_central, opcoes: [{texto, correta}]}` |

### 3. Mapeamento Backend ↔ Frontend

| Backend (`tipo_componente`) | Frontend (`tipo`) |
|-----------------------------|-------------------|
| `ClaritySprint` | `Clarity` |
| `EchoWrite` | `Echo` |
| `NexusConnect` | `Nexus` |

### 4. Repository (`repository/repository.go`)

| Método | Query |
|--------|-------|
| `GetAllForUser` | Globais (usuario_id IS NULL) + do usuário, ordenados por tipo e nível |
| `GetByType` | Filtrado por tipo_componente, globais + do usuário |
| `GetByID` | Busca por ID |

### 5. Service (`service/service.go`)

- `ListGrouped` → busca todos → agrupa por tipo → define `origem` (global/personalizado)
- `GetByType` → mapeia tipo frontend → backend → busca
- `GetByID` → delega ao repository

## Rotas

| Rota | Método | Handler | Descrição |
|------|--------|---------|-----------|
| `/api/v1/exercises` | GET | `ListExercises` | Todos, agrupados (`?user_id=`) |
| `/api/v1/exercises/{id}` | GET | `GetExercise` | Por ID |
| `/api/v1/exercises/type/{tipo}` | GET | `ListExercisesByType` | Por tipo (`?user_id=`) |

## Tabela SQL

- `exercicios` — tipo_componente, dados_exercicio (JSONB), nivel, tags (TEXT[])

## Wiring em `main.go`

```go
exerciseRepository := exRepo.New(db)
exerciseService := exSvc.New(exerciseRepository)
// Passado ao handlers.NewHandler(...)
```
