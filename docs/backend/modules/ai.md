# AI Module

O AI Module é responsável por integrar com serviços de IA Generativa (atualmente **Google Gemini 2.0 Flash**) para fornecer traduções e explicações para frases capturadas.

## Architecture

O AI module consiste em:
1.  **`ai.Service`**: Um wrapper ao redor do cliente `genai` que lida com a comunicação com a API.
2.  **`middleware.AIMiddleware`**: Um middleware HTTP que intercepta requisições para acionar automaticamente o processamento de IA.

## How it Works

### 1. The Service (`internal/ai/service.go`)
- Iniciado com uma API Key (`API_KEY_GEMINI`).
- Fornece um método `Translate` que recebe uma `TranslationRequest` e retorna uma `TranslationResponse`.
- Constrói um prompt forçando a IA a retornar um formato JSON específico contendo:
    - `traducao_completa`
    - `explicacao`
    - `fatias_traducoes` (word-by-word mapping)
- Inclui sanitização robusta de JSON para lidar com potencial wrapping de Markdown (` ```json ... ``` `) da resposta da IA.

### 2. The Middleware (`internal/http/middleware/ia_middleware.go`)
Esta é a técnica principal usada para desacoplar ações sensíveis ao usuário de baixa latência de processamento de IA lento.

#### Workflow:
1.  **Interception**: O middleware envolve `next.ServeHTTP` com um `ResponseRecorder`.
2.  **Request Capture**: Ele lê e desfaz o unmarshal do corpo da requisição para obter o conteúdo da frase e o contexto *antes* de passá-lo para o manipulador.
3.  **Execution**: O manipulador real (e.g., `CreatePhrase`) executa e escreve a resposta.
4.  **Async Trigger**: Se o manipulador retornar um sucesso (2xx), o middleware gera uma **Goroutine**:
    - Chama `aiService.Translate`.
    - Upon success, chama `phraseService.AddDetails` para salvar a tradução.
    - Uses `sseHub.BroadcastTranslation` para notificar o frontend em tempo real.

### Error Handling
- Se a IA falhar, um evento `translation_error` é transmitido via SSE.
- A requisição HTTP original (e.g., "Create Phrase") permanece bem-sucedida independentemente da falha da IA, garantindo que os dados do usuário sejam salvos mesmo se a tradução falhar.

## Code Location
- `internal/ai/`: Core service logic.
- `internal/http/middleware/ia_middleware.go`: Integration logic.
