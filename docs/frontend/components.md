# Componentes (Components)

O projeto segue uma estrutura organizada de componentes para garantir reuso e consistência visual.

## Categorias de Componentes

### 1. UI (`src/components/ui/`)
Componentes de base, muitas vezes baseados em **Radix UI** e **Shadcn UI**. São componentes puramente visuais e altamente configuráveis.
*   **Exemplos**: `Button`, `Input`, `Dialog`, `Sheet`, `Sidebar`, `Skeleton`, `Toast`.
*   **Estilização**: Utilizam Tailwind CSS com a conveniência da biblioteca `class-variance-authority` (cva) para gerenciar variantes (ex: primary, secondary, ghost).

### 2. Dashboard (`src/components/dashboard/`)
Componentes específicos para a experiência do painel de controle e feed de frases.
*   `DashboardSidebar.tsx`: Gerencia a navegação lateral e filtros de idiomas.
*   `PhraseFeed.tsx`: Lista principal de frases com scroll infinito.
*   `PhraseCard.tsx`: Representação visual compacta de uma frase capturada.
*   `PhraseDetailSheet.tsx`: Painel lateral que exibe traduções e explicações detalhadas de uma frase.

### 3. Video (`src/components/video/`)
Componentes para a interface de aprendizado com vídeos.
*   `VideoGrid.tsx`: Exibição de cards de vídeo recomendados.
*   `TranscriptPanel.tsx`: Exibição de transcrições sincronizadas com o player do YouTube.

### 4. Shared (`src/components/exercises/Shared/`)
Utilidades comuns para todos os tipos de exercícios.
*   `ExerciseHeader.tsx`: Cabeçalho padrão com título e subtítulo animados.
*   `TimerDisplay.tsx`: Cronômetro reutilizável para exercícios com tempo limite.

---
*Voltar para o [Início](./index.md)*
