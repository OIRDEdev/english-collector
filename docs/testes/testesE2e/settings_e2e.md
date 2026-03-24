# Settings E2E — Testes de Rotas de Configurações

## Rotas Testadas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/v1/settings?user_id={id}` | ✅ | Buscar configurações do usuário |
| `PUT` | `/api/v1/settings` | ✅ | Atualizar configurações |
| `POST` | `/api/v1/settings/onboarding` | ✅ | Completar onboarding |

## Test Cases (16 testes)

### GET `/settings`

| Teste | Cenário | Status | Validações |
|-------|---------|--------|------------|
| `TestGetSettings_Success` | `user_id=1` válido | `200` | Retorna JSON com todos os campos |
| `TestGetSettings_MissingUserID` | Sem `user_id` no query | `400` | Parâmetro obrigatório |
| `TestGetSettings_InvalidUserID` | `user_id=abc` | `400` | Deve ser inteiro |
| `TestGetSettings_Unauthorized` | Sem cookie de auth | `401` | Middleware bloqueia |
| `TestGetSettings_NonExistentUser` | `user_id=999999` | `200` | Retorna defaults (`onboarding_completo=false`, `tema_interface=dark`) |

### PUT `/settings`

| Teste | Cenário | Status | Validações |
|-------|---------|--------|------------|
| `TestUpdateSettings_Success` | Atualiza `tema_interface=light`, `minutos_diarios=30` | `200` | Response reflete mudanças. Restaura para `dark` após o teste |
| `TestUpdateSettings_MissingUserID` | Payload sem `user_id` | `400` | Campo obrigatório |
| `TestUpdateSettings_EmptyBody` | Body vazio (`nil`) | `400` | `user_id` default é 0 |
| `TestUpdateSettings_Unauthorized` | Sem cookie | `401` | Middleware bloqueia |

### POST `/settings/onboarding`

| Teste | Cenário | Status | Validações |
|-------|---------|--------|------------|
| `TestCompleteOnboarding_Success` | Payload completo com `lang_ids`, `level=advanced`, `daily_*` | `201` | `onboarding_completo=true`, `nivel_proficiencia=advanced` |
| `TestCompleteOnboarding_MissingLangIDs` | Sem `native_lang_id`/`target_lang_id` | `400` | Mensagem: "native_lang_id and target_lang_id are required" |
| `TestCompleteOnboarding_MissingUserID` | Sem `user_id` | `400` | Campo obrigatório |
| `TestCompleteOnboarding_Unauthorized` | Sem cookie | `401` | Middleware bloqueia |

### 🔒 Testes de Segurança

| Teste | Ataque | Status | Resultado |
|-------|--------|--------|-----------|
| `TestSettings_SQLInjection` | `user_id=1;DROP TABLE preferencias_usuario;--` | `400` | Não é int → rejeitado pelo parser |
| `TestSettings_XSSInPayload` | `tema_interface=<script>alert('xss')</script>` | `500` | DB rejeita: `varchar(20)` constraint impede string de 31 chars |
| `TestSettings_HugePayload` | `tema_interface` com 10MB de "A"s | `500` | Backend não crasha, retorna erro controlado |
| `TestSettings_NegativeUserID` | `user_id=-1` | `200` | Retorna defaults (sem crash) |
