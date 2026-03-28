import React, { useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Question } from "./types";

interface TextReferenceProps {
  texto: string;
  questions: Record<string, Question>;
  clickTarget: string | null;
  clickedCorrect: Record<string, boolean>;
  selectedWordIndex: number | null;
  onWordClick: (word: string, index: number) => void;
  onConfirm: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const TextReference = React.memo(function TextReference({
  texto,
  questions,
  clickTarget,
  clickedCorrect,
  selectedWordIndex,
  onWordClick,
  onConfirm,
  containerRef,
}: TextReferenceProps) {
  // Split only once, recompute only when texto changes
  const words = useMemo(() => texto.split(/\s+/), [texto]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full bg-card/20 backdrop-blur-md rounded-2xl border p-6 max-h-72 min-h-[200px] overflow-auto flex-shrink-0 transition-all duration-300 relative",
        clickTarget
          ? "border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
          : "border-white/5"
      )}
    >
      {clickTarget && (
        <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-3 animate-pulse">
          <MessageSquare className="w-3 h-3" />
          <span>Clique na palavra do trecho alvo no texto abaixo</span>
        </div>
      )}

      <p className="text-sm leading-relaxed text-foreground/80">
        {words.map((word, i) => {
          const cleanWord = word.replace(/[.,!?;:'"()]/g, "").toLowerCase();

          const isFoundTarget = Object.entries(clickedCorrect).some(([qKey, found]) => {
            if (!found) return false;
            return questions[qKey]?.trecho_alvo?.toLowerCase().split(/\s+/).includes(cleanWord);
          });

          if (clickTarget) {
            return (
              <span
                key={i}
                onClick={() => onWordClick(word, i)}
                className={cn(
                  "cursor-pointer px-0.5 py-0.5 rounded transition-all inline-block",
                  "hover:bg-violet-400/20 hover:text-violet-300",
                  isFoundTarget && "bg-emerald-500/30 text-emerald-400",
                  selectedWordIndex === i && "bg-violet-500/50 text-white shadow-sm"
                )}
              >
                {word}{" "}
              </span>
            );
          }

          return (
            <span
              key={i}
              className={cn(
                "inline-block px-0.5",
                isFoundTarget && "bg-emerald-500/20 text-emerald-400 rounded"
              )}
            >
              {word}{" "}
            </span>
          );
        })}
      </p>

      {/* Confirm Selection Button */}
      {clickTarget && selectedWordIndex !== null && (
        <div className="absolute bottom-4 right-6 animate-in fade-in slide-in-from-bottom-2">
          <Button
            onClick={onConfirm}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg"
            size="sm"
          >
            Confirmar Seleção
          </Button>
        </div>
      )}
    </div>
  );
});

export default TextReference;
