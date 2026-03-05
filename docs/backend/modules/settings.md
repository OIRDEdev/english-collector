# Settings Module

O Settings Module gerencia todas as preferências do usuário e o fluxo de onboarding.

## Structure

- **`handler.go`**: Endpoints HTTP (`GET`, `PUT`, `POST /onboarding`).
- **`service.go`**: Lógica de negócio (get, update parcial, onboarding completo, troca de idiomas).
- **`repository/`**: Acesso ao banco — **1 função por arquivo**.
    - **`repository.go`**: Struct e construtor.
    - **`model.go`**: `UserSettings`, `UpdateSettingsInput`, `OnboardingInput`.
    - **`get.go`**: `GetByUserID` — busca preferências do usuário.
    - **`upsert.go`**: `Upsert` — INSERT ou UPDATE (check-then-insert).
    - **`update_config.go`**: `UpdateConfig` — merge parcial no JSONB `config`.
    - **`update_languages.go`**: `UpdateUserLanguages` — atualiza `idioma_origem_id` e `idioma_aprendizado_id` (FK para `idiomas`) na tabela `usuarios`.

## Key Features

### 1. Partial Update (SettingsModal)
O `UpdateSettings` aceita um payload parcial — só os campos enviados são atualizados. Campos `nil` (ponteiros) não alteram o valor atual. Agora suporta também a troca de idiomas via `native_lang_id` e `target_lang_id`.

### 2. JSONB Config Merge
Campos dinâmicos de UI (`accent`, `fontSize`, `compactMode`, `captureMode`, `syncInterval`, `notifications`) são armazenados no campo `config jsonb`. O merge é feito com o operador `||` do PostgreSQL, preservando valores existentes.

### 3. Onboarding Transacional
O `CompleteOnboarding` executa duas operações:
1. Atualiza a tabela `usuarios` com `idioma_origem_id` e `idioma_aprendizado_id` (Foreign Keys apontando para `idiomas(id)`).
2. Cria/atualiza `preferencias_usuario` com todas as configurações e marca `onboarding_completo = true`.

### 4. Check-then-Insert/Update
Em vez de `ON CONFLICT (usuario_id)` (que requer UNIQUE constraint), o upsert verifica se o registro existe antes de decidir entre INSERT e UPDATE.

### 5. Troca de Idiomas via Settings
O `UpdateSettings` agora aceita campos opcionais `native_lang_id` e `target_lang_id` (`*int`). Quando presentes, chama `UpdateUserLanguages` para atualizar as FKs na tabela `usuarios`, permitindo que o usuário troque seus idiomas diretamente pelo SettingsModal.

## Models

### `OnboardingInput`
```go
type OnboardingInput struct {
    UserID       int    `json:"user_id"`
    NativeLangID int    `json:"native_lang_id"`   // FK → idiomas(id)
    TargetLangID int    `json:"target_lang_id"`   // FK → idiomas(id)
    DailyMinutes int    `json:"daily_minutes"`
    DailyCards   int    `json:"daily_cards"`
    Plan         string `json:"plan"`
    Level        string `json:"level,omitempty"`
}
```

### `UpdateSettingsInput`
```go
type UpdateSettingsInput struct {
    UserID               int            `json:"user_id"`
    IdiomaPadraoTraducao *string        `json:"idioma_padrao_traducao,omitempty"`
    AutoTraduzir         *bool          `json:"auto_traduzir,omitempty"`
    TemaInterface        *string        `json:"tema_interface,omitempty"`
    NivelProficiencia    *string        `json:"nivel_proficiencia,omitempty"`
    MinutosDiarios       *int           `json:"minutos_diarios,omitempty"`
    CardsDiarios         *int           `json:"cards_diarios,omitempty"`
    NativeLangID         *int           `json:"native_lang_id,omitempty"`  // Troca idioma nativo
    TargetLangID         *int           `json:"target_lang_id,omitempty"` // Troca idioma alvo
    Config               map[string]any `json:"config,omitempty"`
}
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/v1/settings?user_id=N` | Retorna as settings do usuário |
| `PUT` | `/api/v1/settings` | Atualiza settings parcialmente (inclui troca de idiomas) |
| `POST` | `/api/v1/settings/onboarding` | Salva dados do onboarding (idiomas via FK) |

## Integration

- **User Module**: `UpdateUserLanguages` atualiza as colunas `idioma_origem_id` e `idioma_aprendizado_id` (FK) na tabela `usuarios`.
- **Idiomas Table**: Os IDs enviados apontam para a tabela `idiomas`, garantindo integridade referencial.
- **Frontend**: `Onboarding.tsx` e `SettingsModal` chamam os endpoints via `apiService`.

## Curl Tests

```bash
# GET settings
curl -b cookies.txt -s http://localhost:8080/api/v1/settings?user_id=1 | jq

# PUT settings (partial + troca de idiomas)
curl -b cookies.txt -s -X PUT http://localhost:8080/api/v1/settings \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"tema_interface":"light","native_lang_id":1,"target_lang_id":5,"config":{"accent":"emerald"}}' | jq

# POST onboarding
curl -b cookies.txt -s -X POST http://localhost:8080/api/v1/settings/onboarding \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"native_lang_id":1,"target_lang_id":5,"daily_minutes":30,"daily_cards":15,"plan":"pro","level":"intermediate"}' | jq
```
