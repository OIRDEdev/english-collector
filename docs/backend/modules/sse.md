# SSE Module (Server-Sent Events)

O SSE Module fornece capacidades em tempo real para a aplicação, usado principalmente para enviar atualizações de tradução de IA para o cliente sem polling.

## Architecture (`internal/sse/hub.go`)

O componente central é o **`Hub`**, que atua como um broker de mensagens central.

### Components
    
1.  **`Client`**: Representa um usuário conectado. Mantém um canal `make(chan Event)` para receber mensagens.
2.  **`Hub`**:
    - **`clients`**: Um mapa de clientes ativos.
    - **`broadcast`**: Um canal para mensagens de entrada a serem enviadas para todos.
    - **`register/unregister`**: Canais para adicionar/remover clientes com segurança.
    - **`pingTicker`**: Uma rotina de fundo enviando eventos "ping" para manter as conexões vivas e detectar clientes mortos.

### Concurrency Model
O `Hub` executa sua própria Goroutine `Run()`, que utiliza uma instrução `select` para lidar com registro, cancelamento de registro e transmissão sequencialmente. Isso garante a segurança de thread para o mapa `clients` sem travamento complexo no caminho crítico (embora um `RWMutex` seja usado para algumas operações de leitura).

## Usage

### 1. Connection
Os clientes se conectam a `/api/v1/sse/translations`. Use `EventSource` no navegador.
Na conexão, um evento inicial `connected` envia o `client_id`.

### 2. Identification
Os clientes são identificados por `request_id` (do middleware) ou endereço de ponteiro se não estiver presente.
*Nota: Atualmente, não há mapeamento estrito entre Clientes SSE e Usuários Autenticados no código inspecionado, o que significa que as transmissões podem ser globais ou exigir filtragem no lado do cliente.*

### 3. Broadcasting
O `Hub` expõe métodos como `BroadcastTranslation` que filtra clientes ativos e envia o payload estruturado.

```go
func (h *Hub) BroadcastTranslation(phraseID int, ...) {
    // sends "translation" event
}
```

## Protocol Details
- **Headers**:
    - `Content-Type: text/event-stream`
    - `Cache-Control: no-cache`
    - `Connection: keep-alive`
- **Events**:
    - `connected`: Initial handshake.
    - `ping`: Keep-alive.
    - `translation`: Successful AI translation.
    - `translation_error`: AI failure.
