import { Heart, Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyBurst } from "./useKeyBurst";
import VirtualKeyboard from "./components/VirtualKeyboard";
import AnswerSlots from "./components/AnswerSlots";
import type { KeyBurstExerciseProps } from "./types";

export function KeyBurstExercise({ data, onComplete }: KeyBurstExerciseProps) {
  const {
    keys, currentInput, usedKeys, lives,
    isFinished, won, shakeSlots, answer,
    addLetter, clearLast
  } = useKeyBurst(data, onComplete);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-lg mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-mono italic tracking-tighter">
          <span className="text-white">KEY</span>
          <span className="text-cyan-400">BURST</span>
        </h2>
        <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
          {data.instrucao}
        </p>
      </div>

      {/* Lives */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Heart
            key={i}
            className={cn(
              "w-5 h-5 transition-all duration-300",
              i < lives
                ? "text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                : "text-muted/30 scale-90"
            )}
          />
        ))}
      </div>

      {/* Description / Hint */}
      <div className="bg-card/30 backdrop-blur-md rounded-2xl border border-white/5 px-8 py-6 text-center shadow-xl">
        <p className="text-xl text-white font-semibold leading-relaxed">
          &ldquo;{data.descricao}&rdquo;
        </p>
        {data.tags && data.tags.length > 0 && (
          <div className="flex gap-2 justify-center mt-3">
            {data.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answer Slots - Memoized with local shake/bounce animation state */}
      <AnswerSlots
        answerLength={answer.length}
        currentInput={currentInput}
        shakeSlots={shakeSlots}
        won={won}
      />

      {/* Virtual Keyboard - Memoized, only re-renders when keys are used */}
      <VirtualKeyboard
        keys={keys}
        usedKeys={usedKeys}
        isFinished={isFinished}
        onAddLetter={addLetter}
      />

      {/* Backspace Button */}
      {!isFinished && (
        <button
          onClick={clearLast}
          className="flex items-center gap-2 text-muted-foreground/60 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <Delete className="w-4 h-4" />
          Apagar letra
        </button>
      )}

      {/* Result Message */}
      {isFinished && (
        <div className={cn(
          "text-center animate-in fade-in slide-in-from-bottom-4 duration-500",
          won ? "text-emerald-400" : "text-red-400"
        )}>
          <p className="text-2xl font-bold font-mono">
            {won ? "Palavra Formada!" : "Sem vidas!"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {won
              ? `Você formou "${answer}" corretamente.`
              : `A palavra correta era "${answer}".`}
          </p>
        </div>
      )}
    </div>
  );
}
