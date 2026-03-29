# Tipos e Interfaces (Types)

O uso de TypeScript garante que os dados fluam de forma segura entre os serviços e os componentes. A maioria dos tipos globais reside em `src/types/`.

## Principais Definições

### Tipo `Phrase`
Define a estrutura de uma frase capturada, incluindo metadados da página de origem e os detalhes processados pela IA.

### Tipos de Exercício
Localizados em `src/types/api.ts` e dentro das pastas de cada exercício (ex: `EchoExercise/types.ts`). Eles garantem que o orquestrador de sessões saiba exatamente quais dados passar para cada componente lazy-loaded.

---
*Voltar para o [Início](./index.md)*
