# Exercises E2E — Testes de Rotas de Exercícios

## Rotas Testadas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/v1/exercises` | ✅ | Listar tipos com catálogos |
| `GET` | `/api/v1/exercises/catalogo/{id}` | ✅ | Exercícios por catálogo |
| `GET` | `/api/v1/exercises/histories` | ✅ | Histórico de visualizações |
| `GET` | `/api/v1/exercises/{id}` | ✅ | Detalhes de um exercício |
| `POST` | `/api/v1/exercises/{id}/view` | ✅ | Marcar exercício como visto |
| `POST` | `/api/v1/exercises/chain/next-word` | ✅ | IA gera próxima palavra |

## Test Cases (22 testes)

### GET `/exercises`

| Teste | Status | Validações |
|-------|--------|------------|
| `TestListExercises_Success` | `200` | Array com tipos (Memória, Lógica, Linguagem, etc.) e seus catálogos |
| `TestListExercises_Unauthorized` | `401` | Sem cookie |

### GET `/exercises/catalogo/{id}`

10 subtests cobrindo diferentes catálogos e limites de paginação:

| Subtest | Catálogo | Limit | Status Esperado |
|---------|----------|-------|-----------------|
| `Catalogo_2` | 2 | — | `200` ou `204` |
| `Catalogo_3` | 3 | — | `200` ou `204` |
| `Catalogo_4_Limit1` | 4 | 1 | `200` ou `204` |
| `Catalogo_5_Limit2` | 5 | 2 | `200` ou `204` |
| `Catalogo_6` | 6 | — | `200` ou `204` |
| `Catalogo_7` | 7 | — | `200` ou `204` |
| `Catalogo_8` | 8 | — | `200` ou `204` |
| `Catalogo_9` | 9 | — | `200` ou `204` |
| `Catalogo_10_Limit5` | 10 | 5 | `200` ou `204` |
| `Catalogo_3_Limit3` | 3 | 3 | `200` ou `204` |

Validações: `catalogo_id` confere, `dados_exercicio` presente, limit respeitado.

| Teste Extra | Status |
|-------------|--------|
| `TestGetExercisesByCatalogo_InvalidID` (abc) | `400` |
| `TestGetExercisesByCatalogo_Unauthorized` | `401` |

### GET `/exercises/histories`

| Teste | Status | Validações |
|-------|--------|------------|
| `TestListHistories_Success` | `200` | Array de histórias |
| `TestListHistories_WithLimit` (5 subtests: 1,2,3,5,10) | `200` | `len(data) ≤ limit` |
| `TestListHistories_Unauthorized` | `401` | Sem cookie |

### GET `/exercises/{id}`

| Teste | IDs | Status | Validações |
|-------|-----|--------|------------|
| `TestGetExercise_Success` | 2,3,4,6,7,8,9,10,20,30 | `200`/`404` | Campos `id`, `dados_exercicio`, `catalogo_id` presentes |
| `TestGetExercise_InvalidID` (abc) | — | `400` | — |
| `TestGetExercise_NotFound` (99999) | — | `404` | — |
| `TestGetExercise_Unauthorized` | — | `401` | — |

### POST `/exercises/{id}/view`

| Teste | IDs | Status | Nota |
|-------|-----|--------|------|
| `TestMarkExerciseAsViewed_Success` | 1,2,3,4,5 | `200` ou `500` | 500 = já marcado (constraint) |

### POST `/exercises/chain/next-word`

| Teste | Payload | Status |
|-------|---------|--------|
| `EmptyBody` | nil | `400` |
| `EmptyJson` | `{}` | `400` |
| `MissingSentence` | `{"other_field": "test"}` | `400` |
| `ValidSentence` | `{"sentence_so_far": "The quick brown"}` | `200` |
| `SpecialChars` | `!@#$%^&*()` | `200` |
| `Numbers` | `123456789` | `200` |
| `Whitespace` | `"   "` | `200` |
