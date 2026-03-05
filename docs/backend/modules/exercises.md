# Exercises Module

O Exercises Module gerencia exercícios com um sistema de catálogo hierárquico: **Tipo → Catálogo → Exercício**.

## Arquitetura

```
internal/exercises/
├── model.go              # TipoExercicio, ExercicioCatalogo, Exercicio, CatalogoItem, TipoComCatalogo
├── interface.go           # RepositoryInterface + ServiceInterface
├── repository/
│   └── repository.go     # Queries pgxpool (JOINs nas 3 tabelas + filtro por idioma)
├── service/
│   └── service.go        # ListTiposComCatalogo, GetExerciciosByCatalogo, GetByID, MarkExerciseAsViewed
└── tests/
    └── repository_test.go # Testes unitários com pgxmock
```

## Schema SQL

### 1. `tipos_exercicio` — Categorias de exercício
```sql
CREATE TABLE tipos_exercicio (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,   -- "Memória", "Lógica", "Linguagem"
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `exercicios_catalogo` — Exercícios disponíveis no catálogo
```sql
CREATE TABLE exercicios_catalogo (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,   -- "Clarity Master", "Logic Breaker"
    tipo_id INTEGER NOT NULL,     -- FK para tipos_exercicio
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    proef_base INTEGER DEFAULT 10,
    proef_bonus INTEGER DEFAULT 0,
    CONSTRAINT fk_catalogo_tipo FOREIGN KEY (tipo_id) REFERENCES tipos_exercicio(id) ON DELETE RESTRICT
);
```

### 3. `exercicios` — Exercícios individuais com dados JSONB
```sql
CREATE TABLE exercicios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,                            -- NULL = global, NOT NULL = do usuário
    catalogo_id INTEGER NOT NULL,                   -- FK para exercicios_catalogo
    dados_exercicio JSONB,                          -- Payload polimórfico
    nivel INTEGER DEFAULT 1,
    idioma_id INTEGER REFERENCES idiomas(id),       -- Idioma alvo (aprendizado)
    idioma_id_origem INTEGER REFERENCES idiomas(id),-- Idioma nativo (origem)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ex_catalogo FOREIGN KEY (catalogo_id) REFERENCES exercicios_catalogo(id) ON DELETE CASCADE,
    CONSTRAINT fk_ex_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

### 4. `exercicios_visualizados` — Tracking de exercícios já vistos
```sql
CREATE TABLE exercicios_visualizados (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    exercicio_id INTEGER NOT NULL REFERENCES exercicios(id),
    visualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, exercicio_id)
);
```

### Relação
```
tipos_exercicio (1) ──→ (N) exercicios_catalogo (1) ──→ (N) exercicios
      "Memória"              "Flash Recall"              { dados_exercicio JSONB }
      "Lógica"               "Logic Breaker"              ↕ idioma_id → idiomas
      "Linguagem"            "Clarity Master"             ↕ idioma_id_origem → idiomas

usuarios.idioma_aprendizado_id ──→ exercicios.idioma_id   (par de idiomas)
usuarios.idioma_origem_id      ──→ exercicios.idioma_id_origem
```

## Exercícios Globais vs. Pessoais

| Tipo | `usuario_id` | Quem cria | Visível para |
|------|-------------|-----------|--------------|
| **Global** | `NULL` | Admins / Sistema | Todos os usuários do par de idiomas |
| **Pessoal** | `ID do usuario` | O próprio usuário | Apenas o dono |

A query principal filtra com `(e.usuario_id = $2 OR e.usuario_id IS NULL)`, combinando ambos.

## Componentes

### 1. Models (`model.go`)

| Struct | Descrição |
|--------|-----------|
| `TipoExercicio` | Categoria de exercício (id, nome, descricao) |
| `ExercicioCatalogo` | Item do catálogo (id, nome, tipo_id, descricao, ativo) |
| `Exercicio` | Exercício individual (id, usuario_id, catalogo_id, dados_exercicio JSONB, nivel) |
| `CatalogoItem` | DTO: catálogo + nome do tipo (para listagem) |
| `TipoComCatalogo` | DTO: tipo agrupado com seus catálogos (para o frontend) |

### 2. JSONB Polimórfico (`dados_exercicio`)

O payload do campo `dados_exercicio` varia conforme o catálogo:

| Catálogo | Payload JSONB |
|----------|---------------|
| Clarity Master | `{instrucao, texto_completo, palavras_erradas, tempo_leitura}` |
| Echo Write | `{instrucao, texto_total, parte_oculta, texto_lacunado, audio_url}` |
| Nexus Connect | `{instrucao, palavra_central, opcoes: [{texto, correta}]}` |
| Logic Breaker | `{texto, palavra_alvo}` |
| Key Burst | `{descricao, resposta, distratores}` |
| Leitura Imersa | `{texto, tempo_leitura, "perguntas do texto": {...}}` |
| ChainOfSentence | `{instrucao, palavra_inicial}` |
| WordMemory | `{wordList: [{pt, en}], timeLimit}` |
| Connection | `{connector: [string], sentence: string, time: string}` |

### 3. Repository (`repository/repository.go`)

| Método | Descrição |
|--------|-----------|
| `ListTipos` | Todos os tipos, ordenados por ID |
| `ListCatalogo` | Todos os catálogos ativos, JOIN com tipos |
| `GetCatalogoByTipo` | Catálogos filtrados por tipo_id |
| `GetByID` | Exercício por ID |
| `GetByCatalogoID` | Exercícios por catalogo_id, com LIMIT, ordenados por nivel |
| `GetByCatalogoAndUserLanguages` | **Query principal** — filtra por idioma do usuário (FK), globais + pessoais, exclui visualizados |
| `MarkExerciseAsViewed` | Insere em `exercicios_visualizados` (ON CONFLICT DO NOTHING) |

### Query Principal (`GetByCatalogoAndUserLanguages`)

```sql
SELECT e.id, e.usuario_id, e.catalogo_id, e.dados_exercicio, e.nivel, e.criado_em
FROM exercicios e
JOIN usuarios u ON u.id = $2
LEFT JOIN exercicios_visualizados ev ON ev.exercicio_id = e.id AND ev.usuario_id = $2
WHERE e.catalogo_id = $1
  AND e.idioma_id_origem = u.idioma_origem_id      -- FK: idioma nativo
  AND e.idioma_id = u.idioma_aprendizado_id        -- FK: idioma alvo
  AND (e.usuario_id = $2 OR e.usuario_id IS NULL)  -- Globais + pessoais
  AND ev.exercicio_id IS NULL                       -- Exclui já vistos
ORDER BY RANDOM()
LIMIT $3
```

**Como funciona:**
1. `JOIN usuarios` busca as FKs de idioma do usuário logado.
2. Filtra exercícios pelo par exato `idioma_origem × idioma_aprendizado`.
3. Inclui exercícios globais (`usuario_id IS NULL`) **e** do próprio usuário.
4. `LEFT JOIN exercicios_visualizados` exclui os que já foram vistos.
5. `ORDER BY RANDOM()` garante variedade.

### 4. Service (`service/service.go`)

| Método | Descrição |
|--------|-----------|
| `ListTiposComCatalogo` | Busca tipos + catálogos → agrupa catálogos por tipo_id |
| `GetExerciciosByCatalogo` | Busca até N exercícios (default 3, max 10) por catalogo_id, filtrando por idioma do usuário |
| `GetByID` | Delega ao repository |
| `MarkExerciseAsViewed` | Delega ao repository |

## Rotas

| Rota | Método | Handler | Descrição |
|------|--------|---------|-----------|
| `/api/v1/exercises` | GET | `ListExercises` | Tipos + catálogos agrupados |
| `/api/v1/exercises/catalogo/{catalogoId}` | GET | `GetExercisesByCatalogo` | Até 3 exercícios (filtrados por idioma do user, exclui vistos) |
| `/api/v1/exercises/{id}` | GET | `GetExercise` | Exercício por ID |
| `/api/v1/exercises/{id}/view` | POST | `MarkExerciseAsViewed` | Marca exercício como visto |
| `/api/v1/exercises/chain/next-word` | POST | `ChainNextWord` | IA gera próxima palavra (co-op sentence) |

### Exemplos de resposta

**GET `/api/v1/exercises`**
```json
{
  "message": "Exercises catalog retrieved",
  "data": [
    {
      "tipo": { "id": 1, "nome": "Memória", "descricao": "Exercícios de memória" },
      "catalogos": [
        { "id": 1, "nome": "Flash Recall", "descricao": "Memorize padrões.", "tipo_id": 1, "tipo_nome": "Memória", "ativo": true }
      ]
    }
  ]
}
```

**GET `/api/v1/exercises/catalogo/3?limit=3`**
```json
{
  "message": "Exercises retrieved",
  "data": [
    { "id": 10, "catalogo_id": 3, "dados_exercicio": { "texto": "...", "palavra_alvo": "..." }, "nivel": 1 },
    { "id": 11, "catalogo_id": 3, "dados_exercicio": { "texto": "...", "palavra_alvo": "..." }, "nivel": 2 }
  ]
}
```

## Testes

Os testes unitários utilizam `pgxmock` e ficam em `tests/repository_test.go`.

```bash
cd backend && go test -v ./internal/exercises/tests/...
```

| Teste | O que valida |
|-------|-------------|
| `TestListTipos_Success` | Listagem de tipos |
| `TestListCatalogo_Success` | Listagem de catálogos com JOIN |
| `TestGetCatalogoByTipo_Success` | Filtro por tipo_id |
| `TestGetByID_Success` | Busca por ID + unmarshal JSONB |
| `TestGetByID_NotFound` | Erro quando não encontra |
| `TestGetByCatalogoID_Success` | Busca por catalogo_id com LIMIT |
| `TestGetByCatalogoAndUserLanguages_Success` | Query principal com JOIN usuarios + LEFT JOIN visualizados |
| `TestMarkExerciseAsViewed_Success` | INSERT em exercicios_visualizados |

## Wiring em `main.go`

```go
exerciseRepository := exRepo.New(db)
exerciseService := exSvc.New(exerciseRepository)
// Passado ao handlers.NewHandler(...)
```

## Índices de Performance

```sql
CREATE INDEX idx_exercicios_idioma_pair ON exercicios (idioma_id, idioma_id_origem);
CREATE INDEX idx_exercicios_usuario_id ON exercicios (usuario_id);
```

## Chain of Sentence (AI Co-op)

Exercício co-operativo onde o usuário e a IA alternam palavras para construir uma frase gramaticalmente correta.

### Fluxo

1. Frontend carrega o exercício com `{instrucao, palavra_inicial}` do banco
2. Usuário digita uma palavra
3. Frontend chama `POST /api/v1/exercises/chain/next-word` com `{sentence_so_far: "I am"}`
4. Backend chama `ai.Service.ChainNextWord()` → Gemini retorna `{"nextword": "happy"}`
5. Frontend adiciona a palavra da IA e aguarda a próxima do usuário
6. Exercício termina quando a frase tem 6+ palavras e termina com `.` `!` `?`

### Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|------------------|
| `internal/ai/chain.go` | `ChainNextWord()` — prompt para Gemini + parse de `{"nextword": "..."}` |
| `internal/http/handlers/chain.go` | Handler HTTP: valida request, chama AI service |
| `polyglot-flow/src/components/exercises/ChainExercise.tsx` | Componente React com UI co-op |
| `polyglot-flow/src/services/exerciseService.ts` | `chainNextWord()` — POST para o backend |

### Request/Response

**POST `/api/v1/exercises/chain/next-word`**
```json
// Request
{"sentence_so_far": "I am very"}

// Response  
{"message": "Next word generated", "data": {"nextword": "happy."}}
```
