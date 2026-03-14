# Teste Integrado de Extração de Legendas - YouTube

Este documento detalha o teste de integração real do pacote do Módulo `backend/internal/youtube`, certificando a resiliência da biblioteca `youtube-transcript-api-go` com o ecossistema da aplicação PolyGlotFlow.

### Cenário de Teste

**Vídeo Alvo:**
- URL: `https://www.youtube.com/watch?v=XrZ2zF2b9zU`
- ID: `XrZ2zF2b9zU`
- Motivo: Testar com um ID pré-selecionado para observar o comportamento dinâmico do `GetTranscript()` com o fallback de legendas.

### Passos de Execução

Você pode executar isoladamente o teste unitário através do CLI do Go no diretório `backend`:

```bash
cd backend/
go test -v ./internal/youtube/testes/
```

### Comportamento Esperado (Output)

- A conexão passa pela interface da API pública simulando o frontend.
- O payload preenche a validação das propriedades internas do `TranscriptLine` requerendo no mínimo texto válido, um delta de início não-negativo (`Start >= 0`) e uma duração sensata (`Dur > 0`).

**Saída típica do teste (exibindo os primeiros três nós de contexto capturados):**

```text
=== RUN   TestYouTubeService_GetTranscript_Integration
    youtube_service_test.go:27: Video: XrZ2zF2b9zU | Total de linhas trazidas: 85
    youtube_service_test.go:30: Exibindo as 3 primeiras legendas do payload:
        [
          {
            "start": 0.5,
            "dur": 2.5,
            "text": "primeiro bloco de contexto do vídeo..."
          },
          ...
        ]
--- PASS: TestYouTubeService_GetTranscript_Integration (1.23s)
PASS
ok      extension-backend/internal/youtube/testes       1.234s
```
