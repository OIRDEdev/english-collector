# Análise de Compatibilidade e Falhas do Banco de Dados

Esta análise verifica a compatibilidade entre o esquema do banco de dados (`exempla.sql`), os modelos do backend e os componentes de Frontend (`Onboarding` e `Settings`).

## 1. Falhas Críticas no Schema (`exempla.sql`)

### Erro de Sintaxe
Em `backend/migrations/exempla.sql`, na criação da tabela `usuarios` (linhas 239-248), existe um erro de sintaxe (falta de vírgula):

```sql
CREATE TABLE usuarios (
    id integer NOT NULL,
    -- ...
    lingua_origem  varchar(20),
    lingua_de_aprendizado  varchar(20)  <-- FALTA VÍRGULA AQUI
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
```

### Colunas Ausentes (Refresh Tokens)
A tabela `refresh_tokens` no `exempla.sql` não reflete as colunas adicionadas na migration `002` (`ip` e `user_agent`). Se este arquivo for usado para resetar o banco, essa funcionalidade quebrará.

### Falta de Chaves Estrangeiras (Foreign Keys)
O arquivo define tabelas mas não explicita constraints de Foreign Key (FK) para `usuario_id` em tabelas críticas como `preferencias_usuario`, `anki_progresso`, etc. Isso compromete a integridade referencial.

## 2. Compatibilidade: Frontend vs Backend

### Tabela: `usuarios`
| Campo Frontend | Componente | Coluna Banco | Status |
|---|---|---|---|
| `nativeLang` | Onboarding/LanguageSettings | `lingua_origem` | ✅ Compatível |
| `targetLang` | Onboarding/LanguageSettings | `lingua_de_aprendizado` | ✅ Compatível |

### Tabela: `preferencias_usuario`
O frontend coleta muitas configurações que não possuem colunas dedicadas. A coluna `config jsonb` será crucial.

| Campo Frontend | Componente | Destino Sugerido | Status |
|---|---|---|---|
| `theme` | AppearanceSettings | `tema_interface` | ✅ Compatível |
| `accent` | AppearanceSettings | `config->>'accent'` | ⚠️ Requer JSON |
| `fontSize` | AppearanceSettings | `config->>'font_size'` | ⚠️ Requer JSON |
| `compactMode` | AppearanceSettings | `config->>'compact_mode'` | ⚠️ Requer JSON |
| `autoCapture` | ExtensionSettings | `config->>'auto_capture'` | ⚠️ Requer JSON |
| `showPopup` | ExtensionSettings | `config->>'show_popup'` | ⚠️ Requer JSON |
| `notifications`| ExtensionSettings | `config->>'notifications'` | ⚠️ Requer JSON |
| `syncInterval` | ExtensionSettings | `config->>'sync_interval'` | ⚠️ Requer JSON |
| `captureMode` | ExtensionSettings | `config->>'capture_mode'` | ⚠️ Requer JSON |
| `dailyMinutes` | Onboarding | `config->>'daily_minutes'` | ⚠️ Requer JSON |
| `dailyCards` | Onboarding | `config->>'daily_cards'` | ⚠️ Requer JSON |

### Tabela: `assinaturas` e `planos`
O Onboarding envia strings ("free", "pro", "team"), mas o banco espera `plano_id` (integer).
- **Ação Necessária**: Criar um mapa de tradução no Backend ou Seed no banco garantindo IDs fixos (1=Free, 2=Pro, 3=Team).

## 3. Plano de Correção e Integração

### Passo 1: Corrigir Migration `exempla.sql`
Aplicar imediatamente as correções de sintaxe e adicionar colunas faltantes.

```sql
-- Correção na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lingua_origem varchar(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lingua_de_aprendizado varchar(20);

-- Sincronizar refresh_tokens
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip varchar(50);
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_agent text;
```

### Passo 2: Padronizar JSON de Configuração (`model.go`)
Atualizar o modelo `user.Preferences` para incluir struct ou map para o campo `Config`, facilitando o Marshalling/Unmarshalling.

```go
type UserConfig struct {
    Accent       string `json:"accent,omitempty"`
    FontSize     string `json:"font_size,omitempty"`
    CompactMode  bool   `json:"compact_mode,omitempty"`
    DailyMinutes string `json:"daily_minutes,omitempty"`
    // ... outros campos
}

type Preferences struct {
    // ... campos existentes
    Config UserConfig `json:"config"` // Alterar de 'json.RawMessage' ou map para struct tipada se possível
}
```

### Passo 3: Endpoint de Onboarding
Criar um endpoint dedicado `POST /api/v1/users/onboarding` que:
1. Recebe o payload completo do Onboarding.
2. Atualiza `usuarios` (línguas).
3. Atualiza `preferencias_usuario` (config e tema).
4. Cria/Atualiza registro em `assinaturas` baseado no plano escolhido.

## 4. Melhorias de Segurança e Performance

1.  **Indexação em JSONB**: Se for necessário filtrar usuários por configurações (ex: "todos usuários com notificações ativas"), criar índices GIN na coluna `config`.
    ```sql
    CREATE INDEX idx_prefs_config ON preferencias_usuario USING gin (config);
    ```
2.  **Validação de Input**: O Backend deve validar se os valores de `syncInterval` ou `dailyMinutes` recebidos no JSON são permitidos, evitando injeção de dados malformados.
3.  **Constraint de Plano**: Garantir que o plano enviado no Onboarding exista na tabela `planos` antes de criar a assinatura.
