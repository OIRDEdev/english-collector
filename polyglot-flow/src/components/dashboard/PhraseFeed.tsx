import { useRef, useEffect, useCallback, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Phrase } from "@/pages/Dashboard";
import { PhraseCard } from "./PhraseCard";
import { Loader2 } from "lucide-react";

interface PhraseFeedProps {
  phrases: Phrase[];
  onPhraseClick: (phrase: Phrase) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

// Skeleton loader para itens sendo carregados
const PhraseCardSkeleton = memo(() => (
  <div className="rounded-lg border border-border/50 bg-card p-4 animate-pulse">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-5 h-5 rounded bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded" />
      <div className="h-4 bg-muted rounded w-5/6" />
    </div>
  </div>
));

PhraseCardSkeleton.displayName = "PhraseCardSkeleton";

// Memoized card para evitar re-renders desnecessários
const MemoizedPhraseCard = memo(PhraseCard);

export function PhraseFeed({
  phrases,
  onPhraseClick,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: PhraseFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Número de colunas baseado no viewport
  const getColumnCount = useCallback(() => {
    if (typeof window === "undefined") return 1;
    if (window.innerWidth >= 1280) return 3; // xl
    if (window.innerWidth >= 768) return 2;  // md
    return 1;
  }, []);

  // Agrupa frases em rows
  const columnCount = getColumnCount();
  const rowCount = Math.ceil(phrases.length / columnCount);

  // Configuração do virtualizer (por row)
  const rowVirtualizer = useVirtualizer({
    count: rowCount + (hasMore ? 1 : 0), // +1 para loading indicator
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Altura estimada do card + gap
    overscan: 3, // Renderiza 3 rows extras
  });

  // Prefetch: carrega mais quando faltam ~300px
  const handleScroll = useCallback(() => {
    if (!parentRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < 300) {
      onLoadMore();
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  // Attach scroll listener
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (phrases.length === 0 && !isLoadingMore) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <span className="text-3xl">📚</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma frase encontrada
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Capture frases enquanto navega para vê-las aqui.
        </p>
      </div>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-180px)] overflow-auto"
      style={{ contain: "strict" }}
    >
      <div
        className="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {virtualRows.map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= rowCount;
          const startIndex = virtualRow.index * columnCount;
          const rowPhrases = phrases.slice(startIndex, startIndex + columnCount);

          if (isLoaderRow) {
            return (
              <div
                key="loader"
                className="absolute top-0 left-0 w-full flex justify-center py-8"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
              </div>
            );
          }

          return (
            <div
              key={virtualRow.index}
              className="absolute top-0 left-0 w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-0"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowPhrases.map((phrase) => (
                <MemoizedPhraseCard
                  key={phrase.id}
                  phrase={phrase}
                  onClick={() => onPhraseClick(phrase)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
