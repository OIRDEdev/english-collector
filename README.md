# Backend Documentation

Esse diretório contém a documentação completa do backend do Projeto Extensão. O backend é desenvolvido em Go (Golang) e serve como API principal para a Extensão do Chrome e para o Frontend Web (PolyglotFlow).

##  Módulos do Sistema

A documentação está dividida por módulos funcionais para facilitar o entendimento de cada parte do sistema:

### Core & Infraestrutura
- **[Auth Module](docs/backend/modules/auth.md)**: Autenticação via JWT, Cookies (Extensions) e Google OAuth. Gerencia sessões e segurança.
- **[HTTP Layer](docs/backend/modules/http.md)**: Configuração do roteador Chi, Middlewares (CORS, Auth, Logger) e tratamento de erros.
- **[Settings & Onboarding](docs/backend/modules/settings.md)**: Gerenciamento de preferências do usuário, temas, configurações de idioma e fluxo de onboarding.
- **[Cache System](docs/backend/modules/cache.md)**: Implementação de cache Redis para otimização de performance e redução de carga no banco.

### Funcionalidades Principais
- **[AI Module](docs/backend/modules/ai.md)**: Integração com Google Gemini para tradução contextual, explicação gramatical e análise de frases.
- **[Phrase Module](docs/backend/modules/phrase.md)**: CRUD de frases capturadas, sistema de revisão e gerenciamento de conteúdo.
- **[SSE Module (Real-time)](docs/backend/modules/sse.md)**: Server-Sent Events para entrega de traduções em tempo real com **binding por usuário**.
- **[Anki Integration](docs/backend/modules/anki.md)**: Sincronização e geração de decks para o Anki.
- **[Exercises Engine](docs/backend/modules/exercises.md)**: Motor de geração e correção de exercícios baseados nas frases capturadas.

---

## 🛠 Arquitetura e Análise Técnica

Além dos módulos, possuímos documentos de análise técnica e arquitetural:

- **[Compatibilidade e Falhas do Banco](docs/backend/compatibilidade_e_falhas_do_banco.md)**: Análise detalhada do esquema do banco de dados, problemas de integridade referencial e sugestões de correção.
- **[Análise de Bugs Potenciais](docs/backend/potential_bugs.md)**: Levantamento de riscos, race conditions e pontos de falha no código atual.
- **[Melhorias Futuras](docs/backend/future_improvements.md)**: Roadmap técnico, refatorações planejadas e novas features sugeridas.

---

## 🚀 Como Rodar

1.  **Configuração**: Copie `.env.example` para `.env` e configure as credenciais.
2.  **Dependências**:
    - Go 1.21+
    - PostgreSQL
    - Redis (Opcional, mas recomendado)
3.  **Execução**:
    ```bash
    # Rodar via Make
    make run
    
    # Ou direto pelo Go
    go run cmd/api/main.go
    ```
