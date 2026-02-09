# Backend Documentation

Esse diretório contém a documentação do backend do Projeto Extensão. O backend é escrito em Go e serve como a API para a Extensão do Chrome.

## Architecture Overview

A aplicação segue uma arquitetura de **Monólito Modular** com uma separação clara de preocupações usando princípios de **Arquitetura Limpa** dentro de cada módulo.

### Estrutura de Diretórios

- **`cmd/api`**: The entry point of the application. `main.go` handles configuration, database connection, dependency injection, and server startup.
- **`internal`**: Contém a lógica da aplicação, dividida por módulos de domínio.
    - **`ai`**: Cliente para o serviço Google Gemini AI.
    - **`database`**: Conexão e configuração do banco de dados.
    - **`group`**: Lógica de gerenciamento de grupos.
    - **`http`**: Configuração do servidor HTTP, roteamento, middleware e manipuladores.
    - **`phrase`**: Gerenciamento de frases (CRUD, Paginação, Detalhes de Tradução).
    - **`sse`**: Implementação de Server-Sent Events para atualizações em tempo real.
    - **`user`**: Autenticação e gerenciamento de usuários.
- **`migrations`**: Arquivos de migração do banco de dados.

### Key Patterns

- **Dependency Injection**: As dependências (repositórios, serviços) são criadas explicitamente em `main.go` e injetadas nos consumidores (controladores/manipuladores).
- **Middleware Chain**: As requisições HTTP passam por uma cadeia de middlewares (Logging, CORS, Auth, AI Processing) antes de atingir os manipuladores.
- **Async Processing**: Tarefas pesadas (como tradução de IA) são tratadas de forma assíncrona usando Goroutines e interceptação de Middleware.
- **Real-time Updates**: SSE (Server-Sent Events) é usado para enviar atualizações (como conclusão de tradução) para o cliente.

## Getting Started

1.  **Environment Setup**: Copie `.env.example` para `.env` e preencha os valores necessários (credenciais do banco de dados, chaves de API).
2.  **Run with Make**: Use `make run` para iniciar o servidor.
3.  **Run with Go**: `go run cmd/api/main.go`.

## Modules

Documentação detalhada para módulos-chave:

- [AI Module](./modules/ai.md) - Lógica de tradução com Gemini.
- [Phrase Module](./modules/phrase.md) - Lógica de domínio para frases.
- [SSE Module](./modules/sse.md) - Comunicação em tempo real.
- [HTTP Layer](./modules/http.md) - Roteamento e Middleware.

## Análise e Melhorias Futuras

- [Potential Bugs & Risks](./potential_bugs.md) - Análise de riscos da implementação atual.
- [Future Improvements](./future_improvements.md) - Roadmap para escalabilidade e funcionalidades.
