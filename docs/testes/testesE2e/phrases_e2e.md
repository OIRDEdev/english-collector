# Phrases E2E — Testes de Rotas de Frases

## Rotas Testadas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/v1/phrases?limit={n}` | ✅ | Listar frases |
| `GET` | `/api/v1/phrases/{id}` | ✅ | Buscar frase por ID |
| `POST` | `/api/v1/phrases` | ✅ | Criar frase |
| `PUT` | `/api/v1/phrases/{id}` | ✅ | Atualizar frase |
| `DELETE` | `/api/v1/phrases/{id}` | ✅ | Deletar frase |

## Test Cases (6 testes)

Todos os testes que criam dados fazem **cleanup automático** via `DELETE /phrases/{id}`.

| Teste | Cenário | Status | Cleanup |
|-------|---------|--------|---------|
| `TestCreatePhrase_Success` | `POST` com `conteudo`, `idioma_origem`, etc. | `201` | DELETE via API |
| `TestCreatePhrase_Unauthorized` | Sem cookie | `401` | — |
| `TestCreatePhrase_XSS` | `conteudo=<script>alert('xss')</script>` | `201` | DELETE do XSS criado |
| `TestGetPhrase_Success` | Create → GET → verifica conteúdo | `200` | DELETE |
| `TestListPhrases_Success` | Create 3 → GET list → verifica presença | `200` | DELETE dos 3 |
| `TestUpdatePhrase_Success` | Create → PUT (altera conteúdo) → GET (verifica) | `200` | DELETE |
| `TestDeletePhrase_Success` | Create → DELETE → GET (verifica 404) | `200` | — |

### Fluxo CRUD Completo

```
Create → GET (confirma) → PUT (altera) → GET (confirma alteração) → DELETE → GET (confirma 404)
```

Cada teste é independente e não polui o banco de dados.
