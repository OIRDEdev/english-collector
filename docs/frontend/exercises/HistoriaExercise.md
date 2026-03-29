# Historia Exercise

O **Historia Exercise** é um módulo completo de leitura imersiva e compreensão de texto, com suporte a múltiplos tipos de perguntas.

## Fases do Exercício

O exercício é dividido em duas fases principais controladas pelo estado `phase`:

### 1. Fase de Leitura (`reading`)
O usuário tem um tempo determinado (timer) para ler o texto.
- **Timer**: Gerenciado via `useEffect` no hook `useHistoriaExercise`.
- **Navegação**: O usuário pode pular para as perguntas a qualquer momento. Se o tempo esgotar, a transição é automática.

### 2. Fase de Perguntas (`questions`)
Após a leitura, o usuário responde a questões baseadas no texto. O texto permanece disponível no topo como referência (`TextReference`).

## Tipos de Perguntas Suportadas

1.  **Múltipla Escolha**: Seleção de uma opção correta entre várias.
2.  **Resposta Aberta**: Campo de texto para digitação.
3.  **Clique no Texto**: O usuário deve clicar em uma palavra ou frase específica dentro do texto de referência.

## Estrutura de Componentes

- `TextReference.tsx`: Renderiza o texto original. No modo "clique", permite a seleção de palavras.
- `QuestionSection.tsx`: Renderiza a lista de perguntas e gerencia os diferentes inputs (rádio, texto, botão de clique).
- `ReadingPhase.tsx`: Interface simplificada focada apenas no texto e no cronômetro.

---
*Voltar para [Exercícios](../exercises.md)*
