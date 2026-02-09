# Potential Bugs & Technical Risks

## 1. Concorrência Ilimitada no Middleware de IA
**Arquivo**: `internal/http/middleware/ia_middleware.go`
- **Problema**: O middleware lança um `go m.processAITranslation(...)` para cada requisição bem-sucedida.
- **Risco**: Um pico repentino de requisições pode gerar milhares de goroutines. Isso pode levar a:
    - **Esgotamento de Memória**: Se o payload for grande.
    - **Rate Limiting da API**: A API Google Gemini provavelmente bloqueará a chave de API se centenas de requisições forem enviadas simultaneamente.
    - **Connection Starvation**: Se cada goroutine abrir uma conexão com o banco de dados para salvar detalhes.

## 2. SSE Broadcast Scope
**Arquivo**: `internal/sse/hub.go`
- **Problema**: O método `BroadcastTranslation` itera sobre *todos* os clientes ou depende de um canal amplo. Inspecionando `hub.go`, `h.broadcast` envia para o loop `h.clients`.
- **Risco**: A menos que filtrado, **o Usuário B pode receber o evento de tradução do Usuário A**.
- **Correção**: Verificar se `BroadcastTranslation` deve filtrar por `UserID`. Esta é uma preocupação crítica de privacidade.

## 3. Uso de Memória do Response Recorder
**Arquivo**: `internal/http/middleware/ia_middleware.go`
- **Problema**: `responseRecorder` armazena o corpo da resposta *inteiro* na memória (`body *bytes.Buffer`).
- **Risco**: Se um endpoint retornar um grande conjunto de dados (ex: listagem de 10.000 frases) e for envolvido por este middleware, o servidor alocará grandes blocos de memória para cada requisição.
- **Correção**: Garantir que este middleware *apenas* envolva endpoints que retornam respostas pequenas (como `CreatePhrase`), não listas.

## 4. Visibilidade de Erro (Assíncrono)
- **Problema**: Se `processAITranslation` falhar (erro de banco de dados ou erro de IA), a resposta HTTP (200 OK) já foi enviada.
- **Risco**: O usuário pensa que a frase foi criada com sucesso (ela foi), mas a tradução fica em um estado de falha para sempre.
- **Correção**: 
    - Garantir que o frontend escute eventos SSE de `translation_error`.
    - Adicionar um status "Retrying" ou um botão manual "Retry Translation" na UI para frases que não possuem detalhes após X segundos.

## 5. SSE Client Stale Connections
**Arquivo**: `internal/sse/hub.go`
- **Problema**: Se o aba do navegador fechar abruptamente sem enviar um sinal de fechamento TCP específico (ex: perda de energia), o loop de escrita no canal pode travar ou entrar em pânico se não for tratado.
- **Risco**: Vazamento de memória de structs `Client` e Goroutines zumbis.
- **Mitigação**: O mecanismo `Ping` existe (bom!), mas garantir que as escritas no `client.Channel` não bloqueiem ou tenham timeouts para evitar que o Hub congele se um cliente estiver lento/travado.
