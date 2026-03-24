# 🔗 Mapa de Rotas E2E — Todas as URLs Testadas

## Legenda

- ✅ = Teste passa
- 🔒 = Teste de segurança incluso
- 📦 = Teste com cleanup automático

## Rotas Públicas (sem autenticação)

| Método | URL | Testes | Status |
|--------|-----|--------|--------|
| `GET` | `/health` | Health check do TestEnv | ✅ |
| `POST` | `/api/v1/auth/login` | Login, XSS, Bad Input | ✅ 🔒 |
| `POST` | `/api/v1/auth/register` | Register, Duplicate Email | ✅ 📦 |

## Rotas Protegidas (requerem cookie `access_token`)

### Auth

| Método | URL | Testes | Status |
|--------|-----|--------|--------|
| `GET` | `/api/v1/auth/me` | Authorized / Unauthorized | ✅ |
| `POST` | `/api/v1/auth/logout` | Clears cookies | ✅ |

### Settings

| Método | URL | Testes | Status |
|--------|-----|--------|--------|
| `GET` | `/api/v1/settings?user_id={id}` | Success, Missing, Invalid, NonExistent, **SQLi**, **Negative** | ✅ 🔒 |
| `PUT` | `/api/v1/settings` | Success, MissingID, Empty, Unauth, **XSS**, **HugePayload** | ✅ 🔒 |
| `POST` | `/api/v1/settings/onboarding` | Success, MissingLangs, MissingUser, Unauth | ✅ |

### Users

| Método | URL | Testes | Status |
|--------|-----|--------|--------|
| `GET` | `/api/v1/users` | List, Unauth | ✅ |
| `GET` | `/api/v1/users/{id}` | Success, NotFound, Invalid, Unauth, **SQLi**, **Negative** | ✅ 🔒 |
| `POST` | `/api/v1/users` | Create, Duplicate, MissingFields, **XSS** | ✅ 📦 🔒 |
| `PUT` | `/api/v1/users/{id}` | Update | ✅ 📦 |
| `DELETE` | `/api/v1/users/{id}` | Delete, NotFound | ✅ 📦 |

### Phrases

| Método | URL | Testes | Status |
|--------|-----|--------|--------|
| `GET` | `/api/v1/phrases?limit={n}` | List | ✅ 📦 |
| `GET` | `/api/v1/phrases/{id}` | Get | ✅ 📦 |
| `POST` | `/api/v1/phrases` | Create, Unauth, **XSS** | ✅ 📦 🔒 |
| `PUT` | `/api/v1/phrases/{id}` | Update | ✅ 📦 |
| `DELETE` | `/api/v1/phrases/{id}` | Delete | ✅ 📦 |

### Exercises

| Método | URL | Testes | Status |
|--------|-----|--------|--------|
| `GET` | `/api/v1/exercises` | List, Unauth | ✅ |
| `GET` | `/api/v1/exercises/catalogo/{id}` | 10 catálogos, InvalidID, Unauth | ✅ |
| `GET` | `/api/v1/exercises/histories` | List, 5 Limits, Unauth | ✅ |
| `GET` | `/api/v1/exercises/{id}` | 10 IDs, InvalidID, NotFound, Unauth | ✅ |
| `POST` | `/api/v1/exercises/{id}/view` | 5 IDs (sucesso ou constraint) | ✅ |
| `POST` | `/api/v1/exercises/chain/next-word` | 7 payloads (validação + IA) | ✅ |

### Groups

| Método | URL | Testes | Status |
|--------|-----|--------|--------|
| `POST` | `/api/v1/groups` | Create, Unauth | ✅ |

### Anki

| Método | URL | Testes | Status |
|--------|-----|--------|--------|
| `GET` | `/api/v1/anki/due?user_id={id}` | Success, Unauth | ✅ |
| `POST` | `/api/v1/anki/review` | BadInput | ✅ |

### YouTube

| Método | URL | Testes | Status |
|--------|-----|--------|--------|
| `GET` | `/api/v1/youtube/transcript/{id}` | Unauth, MissingID | ✅ |

---

## Resumo

| Categoria | Quantidade |
|-----------|------------|
| Rotas cobertas | **28** |
| Test cases total | **~78** |
| Testes de segurança | **~20** (XSS, SQLi, Huge Payload, Negative IDs) |
| Testes com cleanup | **~15** (evitam poluição do banco) |
| Módulos cobertos | **8** (auth, settings, users, phrases, exercises, groups, anki, youtube) |
