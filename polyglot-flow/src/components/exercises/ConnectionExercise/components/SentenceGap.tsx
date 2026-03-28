import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SentenceGapProps {
  beforeBlank: string;
  afterBlank: string;
  selectedWord: string;
  confirmed: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}

const SentenceGap = React.memo(function SentenceGap({
  beforeBlank,
  afterBlank,
  selectedWord,
  confirmed,
  isCorrect,
  correctAnswer,
}: SentenceGapProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card/20 backdrop-blur-md p-8 md:p-10 transition-all duration-500",
        confirmed && isCorrect && "border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]",
        confirmed && !isCorrect && "border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]",
        !confirmed && "border-white/5"
      )}
    >
      <p className="text-lg md:text-xl leading-relaxed text-foreground/90 font-light">
        {beforeBlank}
        <span
          className={cn(
            "inline-block font-bold px-2 py-0.5 rounded-lg mx-1 transition-all duration-500",
            confirmed && isCorrect && "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30",
            confirmed && !isCorrect && "text-red-300 bg-red-500/15 border border-red-500/30",
            !confirmed && "text-lime-300 bg-lime-500/10 border border-lime-500/20 animate-pulse"
          )}
        >
          {selectedWord}
        </span>
        {afterBlank}
      </p>

      {confirmed && (
        <div
          className={cn(
            "mt-6 pt-4 border-t animate-in fade-in slide-in-from-bottom-2 duration-500",
            isCorrect ? "border-emerald-500/20" : "border-red-500/20"
          )}
        >
          {isCorrect ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Perfeito!</span>
              <span className="text-sm text-muted-foreground ml-2">
                &ldquo;{correctAnswer}&rdquo; é o conector correto.
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-red-400 font-semibold">Não é essa...</p>
              <p className="text-sm text-muted-foreground">
                O conector correto era:{" "}
                <strong className="text-foreground">{correctAnswer}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default SentenceGap;
