# Exercícios (Exercises)

A plataforma possui diversos tipos de exercícios interativos localizados em `src/components/exercises/`. Cada exercício é refatorado para seguir uma arquitetura atômica e performática.

## Arquitetura de Exercícios

Cada exercício segue o padrão de estrutura abaixo:
- **`index.tsx`**: Orquestrador UI.
- **`use[Nome]Logic.ts`**: Hook customizado com toda a lógica de estado e eventos.
- **`types.ts`**: Definições específicas do exercício.
- **`components/`**: Sub-componentes memoizados (`React.memo`) para minimizar re-renders.

## Catálogo de Exercícios

Clique em um exercício para ver os detalhes técnicos:

- [Echo Exercise - Transcrição de Áudio](./exercises/EchoExercise.md)
- [Historia Exercise - Leitura e Perguntas](./exercises/HistoriaExercise.md)
- [Chain Exercise - Fluxo de Palavras Conectadas](./exercises/ChainExercise.md)
- [Connection Exercise - Associação de Sinônimos](./exercises/ConnectionExercise.md)
- [Key Burst Exercise - Escrita Rápida](./exercises/KeyBurstExercise.md)
- [Nexus Exercise - Conexões Semânticas](./exercises/NexusExercise.md)
- [Word Memory Exercise - Tradução Flash](./exercises/WordMemoryExercise.md)

---
*Voltar para o [Início](./index.md)*
