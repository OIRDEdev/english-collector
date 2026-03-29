# Páginas (Pages)

As páginas do Polyglot Flow estão localizadas em `src/pages/`. Elas atuam como containers de alto nível que orquestram a interface do usuário e o fluxo de dados.

## Principais Páginas

### 1. [Dashboard](./dashboard.md)
*   **Arquivo**: `/src/pages/Dashboard.tsx`
*   **Descrição**: Tela principal que exibe o feed de frases capturadas pelo usuário.
*   **Funcionalidades**:
    *   Filtro por categorias (grupos linguísticos).
    *   Scroll infinito para carregar mais frases.
    *   Visualização detalhada de frases em um `Sheet`.

### 2. [Exercises](./exercises_catalog.md)
*   **Arquivo**: `/src/pages/Exercises.tsx`
*   **Descrição**: Catálogo de tipos de exercícios disponíveis.
*   **Funcionalidades**:
    *   Destaque dos exercícios com animações dinâmicas.
    *   Navegação para o início de uma sessão de exercício.

### 3. [ExerciseSession](./exercise_session.md)
*   **Arquivo**: `/src/pages/ExerciseSession.tsx`
*   **Descrição**: Orquestrador de sessões de prática.
*   **Funcionalidades**:
    *   Carregamento dinâmico (`lazy`) de componentes de exercício.
    *   Gerenciamento do progresso da sessão.
    *   Exibição de feedback final de XP e pontuação.

### 4. [Historia](./historia.md)
*   **Arquivo**: `/src/pages/Historia.tsx`
*   **Descrição**: Módulo de leitura imersiva.
*   **Funcionalidades**:
    *   Leitura de textos com suporte para clique em palavras.
    *   Tradução contextual instantânea.

### 5. [Video](./video.md)
*   **Arquivo**: `/src/pages/Video.tsx`
*   **Descrição**: Interface de aprendizado através de vídeos do YouTube.
*   **Funcionalidades**:
    *   Integração com o player do YouTube.
    *   Sincronização de transcrições e pausas automáticas.

### 6. [Conversation](./conversation.md)
*   **Arquivo**: `/src/pages/Conversation.tsx`
*   **Descrição**: Exercício de fala em tempo real com IA via WebSockets.
*   **Funcionalidades**:
    *   Reconhecimento de fala (STT) e síntese de voz (TTS).
    *   Interface de chat fluida com visualização de ondas sonoras.

### 7. [Anki](./anki.md)
*   **Arquivo**: `/src/pages/Anki.tsx`
*   **Descrição**: Sistema de repetição espaçada (SRS) para revisão de frases.
*   **Funcionalidades**:
    *   Review de flashcards com algoritmos de retenção.
    *   Estatísticas de estudo diário.

---
*Voltar para o [Início](./index.md)*
