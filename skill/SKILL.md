---
name: neon-database
description: Skill para interagir com o banco de dados Neon PostgreSQL de forma segura. Permite SELECT, visualização de tabelas, INSERT, UPDATE (com verificação prévia obrigatória) e análise do estado do banco. NUNCA apaga dados.
---

# Skill: Neon PostgreSQL Database

Skill para operações seguras no banco de dados Neon PostgreSQL.

## ⚠️ REGRAS OBRIGATÓRIAS

1. **NUNCA** executar `DELETE`, `DROP`, ou `TRUNCATE` em nenhuma circunstância.
2. **UPDATE** somente após verificação prévia — sempre execute o script de update primeiro **sem** `--confirm` para ver o preview, e só depois com `--confirm`.
3. Sempre usar os scripts fornecidos — **nunca** executar `psql` diretamente.
4. A conexão usa a `DATABASE_URL` do arquivo `backend/.env`.

## Conexão

Os scripts leem automaticamente a `DATABASE_URL` do arquivo `backend/.env` na raiz do projeto. Não é necessário configurar nada extra.

## Ferramentas Disponíveis

### 1. `scripts/db_select.sh` — Consultas SELECT

Executa consultas SELECT no banco. Rejeita qualquer operação que não seja SELECT.

```bash
# Uso
bash skill/scripts/db_select.sh "SELECT * FROM usuarios LIMIT 10"
bash skill/scripts/db_select.sh "SELECT COUNT(*) FROM exercicios"
bash skill/scripts/db_select.sh "SELECT u.nome, e.titulo FROM usuarios u JOIN exercicios e ON u.id = e.user_id"
```

**Argumentos:**
- `$1` — Query SQL (deve começar com SELECT)

---

### 2. `scripts/db_tables.sh` — Visualizar Tabelas

Mostra a estrutura das tabelas do banco: colunas, tipos, constraints, foreign keys e índices.

```bash
# Listar todas as tabelas
bash skill/scripts/db_tables.sh

# Ver estrutura de uma tabela específica
bash skill/scripts/db_tables.sh usuarios

# Ver foreign keys de uma tabela
bash skill/scripts/db_tables.sh usuarios --fk

# Ver índices de uma tabela
bash skill/scripts/db_tables.sh usuarios --indexes
```

**Argumentos:**
- `$1` (opcional) — Nome da tabela
- `--fk` — Mostrar foreign keys
- `--indexes` — Mostrar índices

---

### 3. `scripts/db_insert.sh` — Inserir Dados

Executa um INSERT no banco. Rejeita qualquer operação que não seja INSERT.

```bash
# Uso
bash skill/scripts/db_insert.sh "INSERT INTO usuarios (nome, email) VALUES ('João', 'joao@email.com')"
bash skill/scripts/db_insert.sh "INSERT INTO exercicios (titulo, descricao) VALUES ('Verbo To Be', 'Exercício básico')" --returning
```

**Argumentos:**
- `$1` — Query SQL (deve começar com INSERT)
- `--returning` (opcional) — Adiciona `RETURNING *` à query automaticamente

---

### 4. `scripts/db_update.sh` — Alterar Dados (Com Verificação)

Altera dados no banco em **duas fases obrigatórias**:

**Fase 1 — Preview (sem --confirm):**
Mostra os registros que serão afetados pelo UPDATE antes de executar.

```bash
# Preview — mostra o que será alterado
bash skill/scripts/db_update.sh "usuarios" "id = 5" "nome = 'Novo Nome'"
```

**Fase 2 — Execução (com --confirm):**
Executa o UPDATE de fato, após verificar o preview.

```bash
# Execução — altera de fato
bash skill/scripts/db_update.sh "usuarios" "id = 5" "nome = 'Novo Nome'" --confirm
```

**Argumentos:**
- `$1` — Nome da tabela
- `$2` — Cláusula WHERE (sem a palavra WHERE)
- `$3` — Cláusula SET (sem a palavra SET)
- `--confirm` — Flag para confirmar a execução do UPDATE

> [!CAUTION]
> **SEMPRE** execute primeiro **sem** `--confirm` para ver o preview. Só execute com `--confirm` após verificar que os registros corretos serão alterados.

---

### 5. `scripts/db_analyze.sh` — Análise do Banco

Ferramentas de análise para entender o estado atual do banco de dados.

```bash
# Análise completa
bash skill/scripts/db_analyze.sh

# Análise específica
bash skill/scripts/db_analyze.sh --size        # Tamanho do banco e tabelas
bash skill/scripts/db_analyze.sh --count       # Contagem de registros por tabela
bash skill/scripts/db_analyze.sh --stats       # Estatísticas de uso (cache hit, etc)
bash skill/scripts/db_analyze.sh --indexes     # Índices não utilizados
bash skill/scripts/db_analyze.sh --connections  # Conexões ativas
```

**Argumentos (opcionais):**
- `--size` — Apenas tamanho do banco e tabelas
- `--count` — Apenas contagem de registros
- `--stats` — Apenas estatísticas de uso
- `--indexes` — Apenas análise de índices
- `--connections` — Apenas conexões ativas
- Sem argumentos — Executa análise completa

## Fluxo de Uso Recomendado

1. **Explorar**: Use `db_tables.sh` para entender a estrutura.
2. **Consultar**: Use `db_select.sh` para ler dados.
3. **Analisar**: Use `db_analyze.sh` para verificar o estado do banco.
4. **Inserir**: Use `db_insert.sh` para adicionar novos registros.
5. **Alterar**: Use `db_update.sh` (sempre preview primeiro, depois confirm).
