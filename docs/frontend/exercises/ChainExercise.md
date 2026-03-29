# Chain Exercise

O **Chain Exercise** (Cadeia de Frases) desafia o usuário a continuar uma sequência lógica de palavras ou frases, frequentemente utilizando IA para validar a continuidade.

## Funcionamento

O usuário visualiza uma "corrente" de palavras já aceitas e deve digitar a próxima que faça sentido no contexto.

## Componentes Chave

- `SentenceDisplay.tsx`: Exibe as palavras anteriores em "bolhas" animadas. É memoizado para evitar re-renders enquanto o usuário digita no input principal.
- `useChainExercise.ts`:
    - Gerencia o estado da lista de palavras.
    - Chama o serviço da API para validar se a palavra sugerida pelo usuário é semanticamente válida para continuar a cadeia.

---
*Voltar para [Exercícios](../exercises.md)*
