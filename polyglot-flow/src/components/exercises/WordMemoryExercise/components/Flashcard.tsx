import React from "react";
import { Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WordPair } from "../types";

interface FlashcardProps {
  currentWord: WordPair;
  feedback: "correct" | "wrong" | null;
}

const Flashcard = React.memo(function Flashcard({ currentWord, feedback }: FlashcardProps) {
  if (!currentWord) return null;

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card/20 backdrop-blur-md p-12 text-center transition-all duration-300",
        feedback === "correct" && "border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)]",
        feedback === "wrong" && "border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.15)]",
        !feedback && "border-white/5"
      )}
    >
      {/* Feedback overlay */}
      {feedback && (
        <div
          className={cn(
            "absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200",
            feedback === "correct" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          )}
        >
          {feedback === "correct" ? <Check className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
        </div>
      )}

      <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-4">
        Traduza para inglês
      </p>

      <p
        className={cn(
          "text-5xl font-bold tracking-tight transition-all duration-300",
          feedback === "correct" && "text-emerald-300",
          feedback === "wrong" && "text-red-300",
          !feedback && "text-fuchsia-300"
        )}
      >
        {currentWord.pt}
      </p>

      {/* Show correct answer on wrong */}
      {feedback === "wrong" && (
        <p className="mt-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
          Resposta correta: <strong className="text-foreground">{currentWord.en}</strong>
        </p>
      )}
    </div>
  );
});

export default Flashcard;
