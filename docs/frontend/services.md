# Serviços (Services)

A camada de serviços em `src/services/` gerencia toda a lógica de comunicação com o backend e processamento de dados externos.

## Módulos de Serviço

### 1. `api.ts`
*   **Descrição**: Configuração base do Axios para requisições HTTP.
*   **Propósito**: Define o endereço base da API, interceptores para tokens JWT e tratamento global de erros.

### 2. `phrases/`
*   **Descrição**: Conjunto de funções para CRUD de frases.
*   **Módulos**:
    *   `getPhrases.ts`: Listagem com suporte a cursor para infinite scroll.
    *   `createPhrase.ts`, `updatePhrase.ts`, `deletePhrase.ts`: Operações básicas de dados.

### 3. `groups/`
*   **Descrição**: Gerenciamento de grupos linguísticos (ex: Inglês, Espanhol).
*   **Propósito**: Permite ao usuário organizar seu vocabulário por idioma ou categoria.

### 4. `exerciseService.ts`
*   **Descrição**: Registro e controle de exercícios.
*   **Propósito**: Centraliza a lógica de buscar exercícios por catálogo e gerenciar o envio de resultados.

### 5. `ankiService.ts`
*   **Descrição**: Gerenciamento do sistema de flashcards.
*   **Propósito**: Lida com a busca de cartas pendentes para revisão e submissão de notas do usuário.

### 6. `youtubeService.ts`
*   **Descrição**: Processamento de dados de vídeo do YouTube.
*   **Propósito**: Busca e formatação de transcrições sincronizadas para o player de vídeo.

---
*Voltar para o [Início](./index.md)*
