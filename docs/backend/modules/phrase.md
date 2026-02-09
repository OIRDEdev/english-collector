# Phrase Module

O Phrase Module gerencia o ciclo de vida de "Frases" (capturas) e seus metadados associados.

## Refactoring Note
Este módulo foi recentemente refatorado para unificar a lógica dispersa (a paginação estava anteriormente isolada). Agora ele consolida a lógica de domínio principal, o acesso ao repositório e os métodos de serviço.

## Structure

- **`model.go`**: Define as structs `Phrase` e `PhraseDetails`.
- **`repository/`**:
    - **`crud.go`**: Operações básicas de Create/Read/Update/Delete.
    - **`pagination.go`**: Lógica de paginação baseada em cursor.
    - **`details.go`**: Manipulação de detalhes gerados por IA (traduções).
- **`service/`**:
    - **`crud.go`**: Lógica de negócios para manipulação de frases.
    - **`service.go`**: Definição e composição do serviço.

## Key Features

### 1. Separation of Content and Details
A estrutura de dados separa a entrada bruta do usuário (`Phrase`) do enriquecimento gerado por IA (`PhraseDetails`).
- **`Phrase`**: ID do usuário, Conteúdo, URL de origem, Idioma original.
- **`PhraseDetails`**: Vinculado à `Phrase` por ID. Contém Tradução, Explicação e Fatias de Gramática.

Essa separação permite:
- Salvamento inicial rápido das capturas do usuário.
- Enriquecimento assíncrono sem travar o registro principal.
- Possibilidade de múltiplos enriquecimentos ou re-traduções no futuro.

### 2. Cursor Pagination
Usa paginação baseada em cursor (provavelmente baseada em ID ou Timestamp) para rolagem infinita eficiente no frontend.

## Integration
- **AI Module**: Os métodos `AddDetails` e `GetDetails` são usados principalmente pelo AI Middleware para anexar conteúdo gerado.
- **User Module**: As frases são estritamente limitadas ao `UsuarioID`.
