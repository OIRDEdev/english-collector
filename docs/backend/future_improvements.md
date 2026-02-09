# Melhorias Futuras

Este documento descreve melhorias arquiteturais e ideias de funcionalidades para o backend.

## 1. Pub/Sub Gerenciado pela Autenticação

### Estado Atual
O `Hub` de SSE faz broadcast cegamente para os clientes conectados ou possui apenas um controle básico por ID. Ele não parece estar estritamente acoplado ao **User ID autenticado** proveniente do JWT.

### Problema
- Se o Usuário A cria uma frase, o evento de conclusão deve ser enviado **apenas** para o Usuário A.
- Atualmente, se o broadcast for global (ou se a filtragem no cliente não for rigorosa), existe risco de vazamento de dados ou de filtragem ineficiente.

### Solução Proposta
1. **Integração com Autenticação**
   - Modificar o endpoint SSE para exigir autenticação (JWT).
   - No `Hub.Register`, mapear `UserID` → `[]*Client` (permitindo múltiplas abas por usuário).
2. **Broadcast Direcionado**
   - Alterar `BroadcastTranslation` para receber `targetUserID`.
   - O Hub localiza as conexões desse `UserID` e envia o evento somente para elas.

---

## 2. Barramento de Eventos Modular

### Estado Atual
O acoplamento é forte. O `AIMiddleware` depende diretamente do `sse.Hub` e do `phrase.Service`.

### Solução Proposta
Implementar um **Barramento de Eventos** robusto (usando uma interface interna em Go ou um broker externo como Redis/NATS).

- **Publicador**: `AIMiddleware` publica o evento `TranslationCompleted`.
- **Assinante 1 (Banco de Dados)**: escuta para salvar os detalhes.
- **Assinante 2 (Notificações)**: escuta para enviar atualizações via SSE/WebSocket.
- **Assinante 3 (Analytics)**: escuta para rastrear uso.

Isso desacopla a **Ação** (tradução concluída) dos **Efeitos Colaterais** (salvar, notificar).

---

## 3. Worker Pool para IA

### Estado Atual
Cada request dispara um:

```go
go m.processAITranslation(...)
```

**Risco**: Um pico de tráfego envolve 1000 requests → 1000 Goroutines → 1000 chamadas simultâneas à API Gemini → Rate Limiting ou OOM.

**Solução Proposta**:
Implementar um **Worker Pool** ou **Task Queue** (ex: usando `Asynq` com Redis).
- O Middleware envia um job para a fila.
- A fixed number of workers (e.g., 5) process translations sequentially/concurrently.
- Built-in retries and exponential backoff for AI API failures.

## 4. Caching Layer

Adicionar Redis caching para:
- `ListPhrases` (invalidado em Create/Delete).
- User Profiles.

## 5. Structured Logging & Metrics
- Substituir `log.Printf` por logging estruturado (ex: `slog` ou `zap`).
- Adicionar métricas Prometheus para:
    - Latência de IA.
    - Conexões SSE ativas.
    - Taxas de erro.
