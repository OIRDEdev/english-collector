# 🧪 Testes E2E — URL Testing (Requisições HTTP Reais)

Documentação completa dos testes de integração End-to-End do backend PolyGlotFlow.

> **Filosofia:** Zero mocks. Zero simulação de banco. Todos os testes fazem requisições HTTP reais ao backend rodando, contra o banco de dados PostgreSQL real.

## Arquitetura

```
┌──────────────┐     HTTP      ┌──────────────┐     SQL      ┌──────────────┐
│  Go Test     │ ──────────►   │   Backend    │ ──────────►  │  PostgreSQL  │
│  (client)    │  real req     │  (chi router)│  real query  │  (Neon DB)   │
└──────────────┘               └──────────────┘              └──────────────┘
```

## Pré-requisitos

```bash
# 1. Backend rodando
make run-back

# 2. .env configurado com DATABASE_URL válido
cat backend/.env
```

## Como Rodar

```bash
# Todos os testes (output JSON para dashboard)
make test

# Todos os testes (output verbose no terminal)
make test-v

# Módulo específico
cd backend && go test -v -count=1 ./testes/settings/...
cd backend && go test -v -count=1 ./testes/auth/...
cd backend && go test -v -count=1 ./testes/users/...
cd backend && go test -v -count=1 ./testes/exercises/...
cd backend && go test -v -count=1 ./testes/phrases/...
cd backend && go test -v -count=1 ./testes/groups/...
cd backend && go test -v -count=1 ./testes/anki/...
cd backend && go test -v -count=1 ./testes/youtube/...
```

## Estrutura de Arquivos

```
backend/testes/
├── testutil/
│   └── setup.go                 # TestEnv — cliente HTTP real (sem mocks)
├── auth/
│   ├── login_success_test.go    # Login com credenciais válidas
│   ├── login_bad_input_test.go  # JSON inválido, senha errada, user inexistente
│   ├── login_xss_test.go        # Ataques XSS no login
│   ├── register_success_test.go # Registro com cleanup automático
│   ├── register_bad_input_test.go # Email duplicado, JSON inválido
│   ├── me_unauthorized_test.go  # /me sem e com autenticação
│   └── logout_test.go           # Logout limpa cookies
├── settings/
│   └── settings_test.go         # GET, PUT, Onboarding + segurança
├── users/
│   └── users_test.go            # CRUD completo + segurança
├── phrases/
│   └── phrases_test.go          # CRUD com cleanup + XSS
├── exercises/
│   └── exercises_test.go        # Catálogos, histórias, view, chain
├── groups/
│   └── groups_test.go           # Create + unauthorized
├── anki/
│   └── anki_test.go             # Due cards + review + unauthorized
├── youtube/
│   └── youtube_test.go          # Transcript + unauthorized
└── resultados/
    └── resultados.json          # Output JSON do último test run
```

## Módulos Testados

| Módulo | Testes | Rotas Cobertas | Segurança |
|--------|--------|----------------|-----------|
| **Auth** | 18 | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout` | XSS, SQL Injection |
| **Settings** | 12 | `/settings`, `/settings/onboarding` | SQLi, XSS, Huge Payload, ID Negativo |
| **Users** | 13 | `/users`, `/users/{id}` | SQLi, XSS, ID Negativo, Email Duplicado |
| **Phrases** | 6 | `/phrases`, `/phrases/{id}` | XSS |
| **Exercises** | 22 | `/exercises`, `/exercises/catalogo/{id}`, `/exercises/histories`, `/exercises/{id}`, `/exercises/{id}/view`, `/exercises/chain/next-word` | — |
| **Groups** | 2 | `/groups` | Unauthorized |
| **Anki** | 3 | `/anki/due`, `/anki/review` | Bad Input |
| **YouTube** | 2 | `/youtube/transcript/{id}` | Missing ID |

**Total: ~78 test cases**

## Dashboard HTML

Um dashboard visual está disponível para visualizar os resultados:

```bash
# 1. Rodar os testes e gerar JSON
make test

# 2. Parsear o JSON
python parsear.py

# 3. Abrir o dashboard
python -m http.server 8000
# Acessar: http://localhost:8000/check_testes.html
```
