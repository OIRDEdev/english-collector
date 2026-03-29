# Polyglot Flow - Frontend Documentation

Bem-vindo à documentação oficial do frontend do **Polyglot Flow**. Este projeto é uma plataforma de aprendizado de idiomas interativa, focada em imersão e exercícios práticos.

## Estrutura do Projeto

O frontend é construído com **React**, **TypeScript**, **Tailwind CSS** e **Vite**. A arquitetura segue princípios de design atômico e separação de preocupações (Separation of Concerns).

### Navegação de Documentação

- [Páginas (Pages)](./pages.md): Descrição das rotas e telas principais.
- [Componentes (Components)](./components.md): Sistema de componentes reutilizáveis e UI.
- [Exercícios (Exercises)](./exercises.md): Detalhamento da lógica e estrutura dos exercícios.
- [Serviços (Services)](./services.md): Comunicação com a API e lógica de negócio.
- [Tipos (Types)](./types.md): Definições de interfaces TypeScript.
- [Contextos (Contexts)](./contexts.md): Gerenciamento de estado global.

## Filosofia de Desenvolvimento

1.  **Componentização Atômica**: Componentes pequenos, focados e reutilizáveis (menos de 150 linhas por arquivo).
2.  **Performance**: Uso extensivo de `React.memo`, `useCallback` e `useMemo` para evitar re-renders desnecessários.
3.  **Code Splitting**: Carregamento preguiçoso (`React.lazy`) para reduzir o bundle inicial.
4.  **Tipagem Estrita**: TypeScript em todo o projeto para segurança e manutenibilidade.

---
*Atualizado em: 28 de Março de 2026*
