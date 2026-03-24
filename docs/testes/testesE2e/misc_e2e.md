# Módulos Menores E2E — Groups, Anki, YouTube

## Groups

### Rotas Testadas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/v1/groups` | ✅ | Criar grupo |

### Test Cases

| Teste | Cenário | Status |
|-------|---------|--------|
| `TestCreateGroup_Success` | `POST` com `usuario_id=1`, `nome_grupo` | `200` ou `201` |
| `TestCreateGroup_Unauthorized` | Sem cookie | `401` |

---

## Anki (Repetição Espaçada)

### Rotas Testadas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/v1/anki/due?user_id={id}` | ✅ | Cards pendentes de revisão |
| `POST` | `/api/v1/anki/review` | ✅ | Submeter revisão de card |

### Test Cases

| Teste | Cenário | Status |
|-------|---------|--------|
| `TestGetDueCards_Success` | `GET /anki/due?user_id=1` | `200` |
| `TestSubmitReview_BadInput` | `anki_id=0`, `nota=0` | ≠ `200` (geralmente `400`) |
| `TestGetDueCards_Unauthorized` | Sem cookie | `401` |

---

## YouTube

### Rotas Testadas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/v1/youtube/transcript/{id}` | ✅ | Buscar legendas de vídeo |

### Test Cases

| Teste | Cenário | Status |
|-------|---------|--------|
| `TestTranscript_Unauthorized` | `GET` sem cookie | `401` |
| `TestTranscript_MissingID` | `GET /transcript/` (sem ID) | ≠ `200` (geralmente `404`) |
