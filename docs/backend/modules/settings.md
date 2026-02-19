# Settings Module

O Settings Module gerencia todas as preferências do usuário e o fluxo de onboarding.

## Structure

- **`handler.go`**: Endpoints HTTP (`GET`, `PUT`, `POST /onboarding`).
- **`service.go`**: Lógica de negócio (get, update parcial, onboarding completo).
- **`repository/`**: Acesso ao banco — **1 função por arquivo**.
    - **`repository.go`**: Struct e construtor.
    - **`model.go`**: `UserSettings`, `UpdateSettingsInput`, `OnboardingInput`.
    - **`get.go`**: `GetByUserID` — busca preferências do usuário.
    - **`upsert.go`**: `Upsert` — INSERT ou UPDATE (check-then-insert).
    - **`update_config.go`**: `UpdateConfig` — merge parcial no JSONB `config`.
    - **`update_languages.go`**: `UpdateUserLanguages` — atualiza `lingua_origem` e `lingua_de_aprendizado` na tabela `usuarios`.

## Key Features

### 1. Partial Update (SettingsModal)
O `UpdateSettings` aceita um payload parcial — só os campos enviados são atualizados. Campos `nil` (ponteiros) não alteram o valor atual.

### 2. JSONB Config Merge
Campos dinâmicos de UI (`accent`, `fontSize`, `compactMode`, `captureMode`, `syncInterval`, `notifications`) são armazenados no campo `config jsonb`. O merge é feito com o operador `||` do PostgreSQL, preservando valores existentes.

### 3. Onboarding Transacional
O `CompleteOnboarding` executa duas operações:
1. Atualiza a tabela `usuarios` com `lingua_origem` e `lingua_de_aprendizado`.
2. Cria/atualiza `preferencias_usuario` com todas as configurações e marca `onboarding_completo = true`.

### 4. Check-then-Insert/Update
Em vez de `ON CONFLICT (usuario_id)` (que requer UNIQUE constraint), o upsert verifica se o registro existe antes de decidir entre INSERT e UPDATE.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/v1/settings?user_id=N` | Retorna as settings do usuário |
| `PUT` | `/api/v1/settings` | Atualiza settings parcialmente |
| `POST` | `/api/v1/settings/onboarding` | Salva dados do onboarding |

## Integration

- **User Module**: `UpdateUserLanguages` atualiza diretamente a tabela `usuarios`.
- **Frontend**: `Onboarding.tsx` e `SettingsModal` chamam os endpoints via `apiService`.

## Curl Tests

```bash
# GET settings
curl -s http://localhost:8080/api/v1/settings?user_id=1 | jq

# PUT settings (partial)
curl -s -X PUT http://localhost:8080/api/v1/settings \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"tema_interface":"light","config":{"accent":"emerald"}}' | jq

# POST onboarding
curl -s -X POST http://localhost:8080/api/v1/settings/onboarding \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"native_lang":"pt-br","target_lang":"en","daily_minutes":30,"daily_cards":15,"plan":"pro","level":"intermediate"}' | jq
```
