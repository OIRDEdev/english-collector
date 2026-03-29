# Echo Exercise

O **Echo Exercise** é focado na transcrição de áudio para melhorar a compreensão auditiva e a ortografia.

## Estrutura de Arquivos

- `index.tsx`: Renderiza o visualizador de áudio, o campo de entrada de texto e o feedback de conclusão.
- `useEchoExercise.ts`: Hook que gerencia o estado do input, a reprodução do áudio (mockada no momento) e a validação da resposta.
- `types.ts`: Define `EchoData` e `EchoExerciseProps`.
- `components/`:
    - `AudioVisualizer.tsx`: Interface visual para o player de áudio.
    - `TranscriptionInput.tsx`: Campo de texto estilizado que suporta a inserção da parte oculta da frase.

## Lógica de Validação

A validação ocorre no hook `useEchoExercise` através da função `checkAnswer`. Ela normaliza tanto a entrada do usuário quanto a resposta esperada (removendo pontuação e convertendo para minúsculas) antes de comparar.

- **Acerto Total**: 100 pontos se as strings normalizadas forem idênticas.
- **Acerto Parcial**: 50 pontos se a resposta esperada contiver a entrada do usuário e esta tiver mais da metade do comprimento esperado.

---
*Voltar para [Exercícios](../exercises.md)*
