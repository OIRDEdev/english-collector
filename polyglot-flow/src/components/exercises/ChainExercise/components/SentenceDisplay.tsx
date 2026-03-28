import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WordEntry } from "../types";

interface SentenceDisplayProps {
  words: WordEntry[];
  loading: boolean;
  isFinished: boolean;
  getSentence: (words: WordEntry[]) => string;
  containerRef: React.RefObject<HTMLDivElement>;
}

const SentenceDisplay = React.memo(function SentenceDisplay({
  words,
  loading,
  isFinished,
  getSentence,
  containerRef,
}: SentenceDisplayProps) {
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-2xl border bg-card/20 backdrop-blur-md p-8 min-h-[240px] max-h-[360px] overflow-auto transition-all duration-500",
        isFinished
          ? "border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          : "border-white/5"
      )}
    >
      <div className="flex flex-wrap gap-2.5 items-center">
        {words.map((word, i) => (
          <span
            key={i}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 animate-in fade-in zoom-in-90",
              word.from === "initial" &&
                "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]",
              word.from === "user" &&
                "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20",
              word.from === "ai" &&
                "bg-violet-500/15 text-violet-300 border border-violet-500/20"
            )}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            {word.text}
          </span>
        ))}
        {loading && (
          <span className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 animate-pulse">
            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
          </span>
        )}
      </div>

      {isFinished && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-2xl">
          <div className="text-center space-y-3 animate-in zoom-in-90 duration-500">
            <div className="text-4xl">🎉</div>
            <p className="text-lg font-bold text-emerald-400">Frase completa!</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              &ldquo;{getSentence(words)}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default SentenceDisplay;
