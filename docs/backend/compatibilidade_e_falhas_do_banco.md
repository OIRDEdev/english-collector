# Análise de Compatibilidade e Falhas do Banco de Dados

Esta análise verifica a compatibilidade entre o esquema do banco de dados (`exempla.sql`), os modelos do backend e os componentes de Frontend (`Onboarding` e `Settings`).

> **Atualizado em 2026-03-05** após a migration `002_user_language_fk.sql`.

## 1. Mudanças Recentes no Schema

### Migration `002_user_language_fk.sql` — Normalização de Idiomas
As colunas textuais `lingua_origem` e `lingua_de_aprendizado` na tabela `usuarios` foram substituídas por Foreign Keys apontando para `idiomas(id)`:

```sql
-- Antes: varchar(20) sem integridade
lingua_origem varchar(20),
lingua_de_aprendizado varchar(20)

-- Depois: FK com integridade referencial
idioma_origem_id INTEGER REFERENCES idiomas(id),
idioma_aprendizado_id INTEGER REFERENCES idiomas(id)
```

Índices de performance adicionados:
```sql
CREATE INDEX idx_exercicios_idioma_pair ON exercicios (idioma_id, idioma_id_origem);
CREATE INDEX idx_exercicios_usuario_id ON exercicios (usuario_id);
```

## 2. Compatibilidade Atual: Frontend vs Backend

### Tabela: `usuarios`
| Campo Frontend | Componente | Coluna Banco | Status |
|---|---|---|---|
| `nativeLang` (agora `native_lang_id`) | Onboarding | `idioma_origem_id` (FK → idiomas) | ✅ Compatível |
| `targetLang` (agora `target_lang_id`) | Onboarding | `idioma_aprendizado_id` (FK → idiomas) | ✅ Compatível |

### Tabela: `preferencias_usuario`
O frontend coleta muitas configurações que não possuem colunas dedicadas. A coluna `config jsonb` é utilizada.

| Campo Frontend | Componente | Destino | Status |
|---|---|---|---|
| `theme` | AppearanceSettings | `tema_interface` | ✅ Compatível |
| `accent` | AppearanceSettings | `config->>'accent'` | ✅ Implementado via JSONB |
| `fontSize` | AppearanceSettings | `config->>'font_size'` | ✅ Implementado via JSONB |
| `compactMode` | AppearanceSettings | `config->>'compact_mode'` | ✅ Implementado via JSONB |
| `autoCapture` | ExtensionSettings | `config->>'auto_capture'` | ✅ Implementado via JSONB |
| `showPopup` | ExtensionSettings | `config->>'show_popup'` | ✅ Implementado via JSONB |
| `notifications`| ExtensionSettings | `config->>'notifications'` | ✅ Implementado via JSONB |
| `syncInterval` | ExtensionSettings | `config->>'sync_interval'` | ✅ Implementado via JSONB |
| `captureMode` | ExtensionSettings | `config->>'capture_mode'` | ✅ Implementado via JSONB |
| `dailyMinutes` | Onboarding | `minutos_diarios` (coluna dedicada) | ✅ Compatível |
| `dailyCards` | Onboarding | `cards_diarios` (coluna dedicada) | ✅ Compatível |

### Tabela: `exercicios`
| Campo | Coluna | Status |
|---|---|---|
| Idioma alvo | `idioma_id` → FK para `idiomas(id)` | ✅ Compatível |
| Idioma origem | `idioma_id_origem` → FK para `idiomas(id)` | ✅ Compatível |
| Exercícios globais | `usuario_id IS NULL` | ✅ Filtrado na query |
| Exercícios do user | `usuario_id = ID` | ✅ Filtrado na query |
| Exercícios vistos | `LEFT JOIN exercicios_visualizados` | ✅ Excluídos na query |

### Tabela: `assinaturas` e `planos`
O Onboarding envia strings ("free", "pro", "team"), mas o banco espera `plano_id` (integer).
- **Ação Pendente**: Criar um mapa de tradução no Backend ou Seed no banco garantindo IDs fixos (1=Free, 2=Pro, 3=Team).

## 3. Falhas Resolvidas

| Falha | Status |
|-------|--------|
| Colunas `lingua_origem`/`lingua_de_aprendizado` sem FK | ✅ Resolvido — agora são `idioma_origem_id`/`idioma_aprendizado_id` com FK |
| Exercícios não filtravam por idioma do usuário | ✅ Resolvido — query usa JOIN com `usuarios` para ler FKs |
| Exercícios globais vs pessoais sem distinção na API | ✅ Resolvido — filtro `(usuario_id = $2 OR usuario_id IS NULL)` |
| Exercícios já vistos retornavam na listagem | ✅ Resolvido — `LEFT JOIN exercicios_visualizados` |

## 4. Pontos de Atenção Remanescentes

### Falta de Chaves Estrangeiras em tabelas auxiliares
O `exempla.sql` não explicita constraints de FK para `usuario_id` em tabelas como `preferencias_usuario`, `anki_progresso`. Isso compromete a integridade referencial se usado para recriar o banco.

### Mapeamento de Planos
O campo `plan` do Onboarding (string: "free", "pro", "team") não é salvo em `assinaturas`. É necessário criar um endpoint ou lógica para traduzir string → `plano_id`.

## 5. Melhorias de Segurança e Performance

1. **Validação de Input**: O Backend valida que `native_lang_id` e `target_lang_id` são `> 0` no onboarding. Poderia adicionalmente verificar se o ID existe na tabela `idiomas`.
2. **Indexação JSONB**: Se necessário filtrar por `config`, criar índice GIN:
    ```sql
    CREATE INDEX idx_prefs_config ON preferencias_usuario USING gin (config);
    ```
3. **Constraint de Plano**: Garantir que o plano existe na tabela `planos` antes de criar `assinaturas`.
