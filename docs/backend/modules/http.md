# HTTP Layer

A camada HTTP lida com requisições externas, roteamento e aplicação de middleware.

## Router (`internal/http/router.go`)

O roteador usa `go-chi`, um roteador leve e idiomático.

### Structure
- **Global Middleware**:
    - `RequestID`: Tracing.
    - `RealIP`: Security logging.
    - `Logger`: Request logging.
    - `Recoverer`: Panic recovery.
    - `CORS`: Cross-Origin Resource Sharing.

### API Versioning
Rotas são prefixadas com `/api/v1` para permitir futuras mudanças sem afetar clientes existentes.

## Middleware

### 1. AI Middleware (`middleware/ia_middleware.go`)
Intercepts `POST /phrases` and `PUT /phrases/{id}`.
- **Concept**: "Fire and Forget" (da perspectiva do cliente).
- **Mechanism**: Captura a requisição, permite que o manipulador prossiga e, em seguida, inicia uma tarefa de tradução em segundo plano se o manipulador for bem-sucedido.

### 2. Auth Middleware (Inferred)
Há referências a `UserService` e `TokenService`, pois será adicionado futuramente.

## Handlers (`internal/http/handlers/`)
Handlers são "Controllers". Eles fazem o parse de requisições HTTP, chamam os métodos do Serviço e formatam as respostas HTTP.
- `NewHandler` permite a injeção de dependência de todos os serviços necessários.
