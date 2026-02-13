# Exercises Module

O Exercises Module gerencia exercícios com um sistema de catálogo hierárquico: **Tipo → Catálogo → Exercício**.

## Arquitetura

```
internal/exercises/
├── model.go              # TipoExercicio, ExercicioCatalogo, Exercicio, CatalogoItem, TipoComCatalogo
├── interface.go           # RepositoryInterface + ServiceInterface
├── repository/
│   └── repository.go     # Queries pgxpool (JOINs nas 3 tabelas)
└── service/
    └── service.go        # ListTiposComCatalogo, GetExerciciosByCatalogo, GetByID
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
    CONSTRAINT fk_catalogo_tipo FOREIGN KEY (tipo_id) REFERENCES tipos_exercicio(id) ON DELETE RESTRICT
);
```

### 3. `exercicios` — Exercícios individuais com dados JSONB
```sql
CREATE TABLE exercicios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,           -- NULL = global
    catalogo_id INTEGER NOT NULL, -- FK para exercicios_catalogo
    dados_exercicio JSONB,        -- Payload polimórfico
    nivel INTEGER DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ex_catalogo FOREIGN KEY (catalogo_id) REFERENCES exercicios_catalogo(id) ON DELETE CASCADE
);
```

### Relação
```
tipos_exercicio (1) ──→ (N) exercicios_catalogo (1) ──→ (N) exercicios
      "Memória"              "Flash Recall"              { dados_exercicio JSONB }
      "Lógica"               "Logic Breaker"
      "Linguagem"            "Clarity Master"
```

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

| Método | Query |
|--------|-------|
| `ListTipos` | Todos os tipos, ordenados por ID |
| `ListCatalogo` | Todos os catálogos ativos, JOIN com tipos, ordenados por tipo_id → nome |
| `GetCatalogoByTipo` | Catálogos filtrados por tipo_id |
| `GetByID` | Exercício por ID |
| `GetByCatalogoID` | Exercícios por catalogo_id, com LIMIT, ordenados por nivel |

### 4. Service (`service/service.go`)

| Método | Descrição |
|--------|-----------|
| `ListTiposComCatalogo` | Busca tipos + catálogos → agrupa catálogos por tipo_id |
| `GetExerciciosByCatalogo` | Busca até N exercícios (default 3, max 10) por catalogo_id |
| `GetByID` | Delega ao repository |

## Rotas

| Rota | Método | Handler | Descrição |
|------|--------|---------|-----------|-
| `/api/v1/exercises` | GET | `ListExercises` | Tipos + catálogos agrupados |
| `/api/v1/exercises/catalogo/{catalogoId}` | GET | `GetExercisesByCatalogo` | Até 3 exercícios de um catálogo (`?limit=N`) |
| `/api/v1/exercises/{id}` | GET | `GetExercise` | Exercício por ID |
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
        { "id": 1, "nome": "Flash Recall", "descricao": "Memorize padrões.", "tipo_id": 1, "tipo_nome": "Memória", "ativo": true },
        { "id": 2, "nome": "Sequence Keeper", "descricao": "Repita sequências.", "tipo_id": 1, "tipo_nome": "Memória", "ativo": true }
      ]
    },
    {
      "tipo": { "id": 2, "nome": "Lógica", "descricao": "Exercícios de lógica" },
      "catalogos": [
        { "id": 3, "nome": "Logic Breaker", "descricao": "Encontre contradições.", "tipo_id": 2, "tipo_nome": "Lógica", "ativo": true }
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

## Wiring em `main.go`

```go
exerciseRepository := exRepo.New(db)
exerciseService := exSvc.New(exerciseRepository)
// Passado ao handlers.NewHandler(...)
```

## Notas

- **Sem mapeamento de tipos**: Removido o antigo `mapTipoToFrontend`/`mapTipoToBackend`. O tipo agora vem diretamente da tabela `tipos_exercicio`.
- **Catálogo como fonte de verdade**: O nome do exercício e sua categorização vêm do catálogo, não mais de `tipo_componente`.
- **Exercícios globais vs. personalizados**: `usuario_id IS NULL` = global, senão personalizado (padrão atual mantido na tabela `exercicios`).

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
