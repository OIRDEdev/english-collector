# Authentication Module (`internal/auth`)

## Visão Geral
Este módulo gerencia a autenticação de usuários, integrando login tradicional (email/senha) e login social (Google). Utiliza **JWT (JSON Web Tokens)** armazenados em **HttpOnly Cookies** para segurança aprimorada contra ataques XSS (Cross-Site Scripting).

## Estrutura do Código
O módulo está localizado em `backend/internal/auth` e se comunica com o módulo `user`.

- **`handler.go`**: 
    - Atua como a camada de transporte HTTP.
    - Gerencia os Cookies (`access_token`, `refresh_token`).
    - Define as propriedades de segurança dos cookies (`HttpOnly`, `Secure`, `SameSite`).
    - Endpoints:
        - `POST /login`: Autentica e define cookies.
        - `POST /register`: Cria conta e define cookies.
        - `POST /google`: Valida token do Google e autentica/registra.
        - `POST /refresh`: Renova o par de tokens usando o refresh token.
        - `POST /logout`: Limpa os cookies.
        - `GET /me`: Retorna dados do usuário logado (checagem de sessão).

- **`service.go`**:
    - Contém a lógica de negócio da autenticação.
    - `GoogleLogin`: Valida o ID Token do Google, verifica existência do usuário e decide entre login ou registro.
    - Delega a criação e validação de usuários para o `internal/user/service.go`.

- **Integração com `internal/user`**:
    - O repositório de refresh tokens (`refresh_token_repository.go`) foi atualizado para armazenar `IP` e `UserAgent`.
    - O serviço de usuário (`user/service.go`) realiza a validação de **Fingerprint** ao renovar tokens.

## Fluxos de Autenticação

### 1. Login & Registro (Tradicional)
1. Frontend envia credenciais (JSON).
2. Backend valida credenciais (hash de senha).
3. Backend gera par de tokens:
    - **Access Token**: JWT, validade curta (1 hora).
    - **Refresh Token**: String opaca, validade longa (7 dias ou mais).
4. Backend grava o Refresh Token no banco com o **IP** e **User-Agent** do cliente (Fingerprint).
5. Backend responde com status 200/201 e define os cookies `HttpOnly`.

### 2. Login Social (Google)
1. Frontend realiza login com Google e obtém um `credential` (ID Token).
2. Frontend envia o token para `POST /auth/google`.
3. Backend valida a assinatura do token Google.
4. Backend verifica se o email já existe:
    - **Existe**: Realiza login forçado (sem senha).
    - **Não Existe**: Registra novo usuário com uma senha aleatória segura (placeholder) e loga.
5. Define cookies de sessão como no fluxo tradicional.

### 3. Renovação de Token (Refresh Flow)
1. Frontend recebe `401 Unauthorized`.
2. Interceptor (Axios) chama `POST /auth/refresh` automaticamente.
3. Browser envia o cookie `refresh_token` (o JS não tem acesso, mas o browser envia).
4. Backend busca o token no banco.
5. **Security Check (Fingerprint)**: Backend compara o IP e User-Agent gravados com os da requisição atual.
    - **Match**: Token antigo é revogado, novo par é gerado e cookies atualizados.
    - **Mismatch**: Token é revogado imediatamente e erro é retornado (possível roubo de sessão).

## Pontos de Melhoria (Roadmap)

### 1. Segurança & Hardening
- **CSRF Protection**: Atualmente confiamos em `SameSite=Lax`. Para maior segurança, implementar **Double Submit Cookie** ou tokens CSRF dedicados para métodos de mutação.
- **Rate Limiting**: Adicionar middleware de limite de requisições (Redis ou in-memory) nas rotas de `login` e `refresh` para evitar força bruta.
- **Strict Cookie Validation**: Garantir que o middleware de autenticação (`AIMiddleware` ou similar) esteja configurado para ler tokens estritamente dos cookies, ignorando o header `Authorization` se desejado.

### 2. Débito Técnico
- **Google Register Password**: Atualmente, usuários criados via Google recebem uma senha aleatória baseada em timestamp (`crypto/rand` seria melhor) e não utilizável. Idealmente, marcar a conta como `strategies: ['google']` e não exigir senha neste caso.
- **Logout Database Revocation**: O endpoint de logout atual apenas limpa os cookies. Deveria também marcar o refresh token como revogado no banco de dados.

## Análise de Vulnerabilidades

### 1. XSS (Cross-Site Scripting)
- **Risco**: Baixo/Mitigado.
- **Por quê**: Os tokens sensíveis estão em cookies `HttpOnly`, o que impede que scripts maliciosos (via XSS) leiam os tokens.

### 2. CSRF (Cross-Site Request Forgery)
- **Risco**: Médio.
- **Cenário**: Um site malicioso pode tentar forçar o usuário a fazer requisições para a API (ex: `POST /users`).
- **Mitigação Atual**: `SameSite=Lax`. Navegadores modernos bloqueiam cookies de terceiros em POSTs cross-site por padrão.
- **Recomendação**: Revisar necessidade de token anti-CSRF caso a API seja consumida por clientes que não respeitam SameSite ou em subdomínios complexos.

### 3. Session Hijacking (Roubo de Sessão)
- **Risco**: Médio/Baixo.
- **Cenário**: Se o cookie `refresh_token` for roubado (ex: malware na máquina, proxy inseguro).
- **Mitigação**: **Fingerprinting**. Se o atacante tentar usar o token de outro IP ou navegador, a validação falhará e a sessão será invalidada.

### 4. Brute Force
- **Risco**: Alto (nas rotas de login).
- **Mitigação Atual**: Nenhuma explícita no código.
- **Recomendação**: Implementar bloqueio de IP após N tentativas falhas.

## Análise de Qualidade de Código e Melhorias (`internal/auth`)

Esta seção detalha melhorias específicas identificadas na análise do código fonte (`handler.go` e `service.go`).

### 1. Segurança & Configuração
- **Hardcoded Credentials**:
    - **Problema**: `GoogleClientID` está hardcoded em `service.go`.
    - **Correção**: Mover para variáveis de ambiente (`os.Getenv("GOOGLE_CLIENT_ID")`).
    - **Problema**: Flag `Secure: false` nos cookies em `handler.go`.
    - **Correção**: Utilizar configuração de ambiente para definir `Secure: true` em produção.
- **Cookie Path**:
    - **Sugestão**: Restringir o path do cookie `refresh_token` apenas para o endpoint de renovação (`/api/v1/auth/refresh`) para minimizar a superfície de ataque.

### 2. Robustez & Performance
- **HTTP Client (Google Verification)**:
    - **Problema**: O método `verifyGoogleToken` usa `http.Get` padrão, que não possui timeout configurado.
    - **Risco**: Pode causar exaustão de recursos se a API do Google estiver lenta/indisponível.
    - **Correção**: Instanciar um `http.Client` com timeout explícito (ex: 10s).
- **Magic Numbers**:
    - **Problema**: Tempos de expiração (1h, 7d) estão hardcoded no handler.
    - **Correção**: Mover para constantes exportadas ou configuração.

### 3. Tratamento de Erros
- **Vazamento de Detalhes**:
    - **Problema**: `http.Error(w, err.Error(), ...)` retorna erros brutos do serviço.
    - **Correção**: Mapear erros de serviço para mensagens amigáveis ao usuário ou códigos de erro padronizados, evitando expor detalhes internos.

### 4. Lógica de Negócio (Social Login)
- **Geração de Senha**:
    - **Problema**: `time.Now().String()` gera senhas com baixa entropia.
    - **Correção**: Utilizar `crypto/rand` para gerar senhas criptograficamente seguras ou refatorar o modelo de `User` para suportar logins sem senha (nullable password).
- **Biblioteca Oficial**:
    - **Sugestão**: Substituir a validação manual HTTP pela biblioteca oficial `google.golang.org/api/idtoken` para maior conformidade e segurança.

### 5. Arquitetura (`Me` Endpoint)
- **Implementação Pendente**:
    - **Problema**: O endpoint `Me` retorna dados mockados.
    - **Correção**: Implementar middleware que extrai o ID do usuário do `access_token` validated e popula o contexto da requisição (`r.Context()`), permitindo que o handler recupere o usuário real.

