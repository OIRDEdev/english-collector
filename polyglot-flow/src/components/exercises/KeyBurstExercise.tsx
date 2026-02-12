import { useState, useEffect, useMemo } from "react";
import { Heart, Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KeyBurstData {
  id?: number;
  instrucao: string;
  descricao: string;
  resposta: string;
  distratores: string;
  tags?: string[];
}

interface KeyBurstExerciseProps {
  data: KeyBurstData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function KeyBurstExercise({ data, onComplete, onExit }: KeyBurstExerciseProps) {
  const [currentInput, setCurrentInput] = useState<{ char: string; keyIndex: number }[]>([]);
  const [usedKeys, setUsedKeys] = useState<Set<number>>(new Set());
  const [lives, setLives] = useState(3);
  const [isFinished, setIsFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [shakeSlots, setShakeSlots] = useState(false);

  const answer = data.resposta.toUpperCase();
  const distractors = data.distratores.toUpperCase();

  // Shuffle the keyboard letters once
  const keys = useMemo(() => {
    const allChars = (answer + distractors).split("");
    // Fisher-Yates shuffle
    for (let i = allChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
    }
    return allChars;
  }, [answer, distractors]);

  const addLetter = (char: string, keyIndex: number) => {
    if (isFinished || currentInput.length >= answer.length) return;

    const newInput = [...currentInput, { char, keyIndex }];
    setCurrentInput(newInput);
    setUsedKeys(prev => new Set(prev).add(keyIndex));

    // Check if word is complete
    if (newInput.length === answer.length) {
      const result = newInput.map(i => i.char).join("");
      if (result === answer) {
        // Win!
        setWon(true);
        setIsFinished(true);
        const score = lives === 3 ? 100 : lives === 2 ? 75 : 50;
        setTimeout(() => onComplete(score), 1800);
      } else {
        // Wrong word — lose a life
        const newLives = lives - 1;
        setLives(newLives);
        setShakeSlots(true);

        setTimeout(() => {
          setShakeSlots(false);
          if (newLives <= 0) {
            setIsFinished(true);
            setTimeout(() => onComplete(0), 1000);
          } else {
            // Reset input
            setCurrentInput([]);
            setUsedKeys(new Set());
          }
        }, 600);
      }
    }
  };

  const clearLast = () => {
    if (isFinished || currentInput.length === 0) return;

    const last = currentInput[currentInput.length - 1];
    setCurrentInput(prev => prev.slice(0, -1));
    setUsedKeys(prev => {
      const next = new Set(prev);
      next.delete(last.keyIndex);
      return next;
    });
  };

  // Calculate grid cols based on key count
  const gridCols = keys.length <= 10 ? "grid-cols-5" : keys.length <= 14 ? "grid-cols-7" : "grid-cols-8";

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

      {/* Answer Slots */}
      <div
        className={cn(
          "flex justify-center flex-wrap gap-2",
          shakeSlots && "animate-[shake_0.4s_ease-in-out]"
        )}
      >
        {Array.from({ length: answer.length }).map((_, i) => {
          const filled = i < currentInput.length;
          const char = filled ? currentInput[i].char : "";

          return (
            <div
              key={i}
              className={cn(
                "w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-black font-mono uppercase transition-all duration-200",
                "border-2",
                filled
                  ? won
                    ? "border-emerald-400 bg-emerald-500/10 text-emerald-400 animate-[bounce_0.5s_ease_infinite] shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                    : "border-cyan-400 bg-cyan-400/5 text-cyan-400 -translate-y-0.5"
                  : "border-white/10 text-muted-foreground/30"
              )}
            >
              {char}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <div className={cn("grid gap-3 max-w-sm mx-auto", gridCols)}>
        {keys.map((char, i) => {
          const isUsed = usedKeys.has(i);
          return (
            <button
              key={i}
              onClick={() => addLetter(char, i)}
              disabled={isUsed || isFinished}
              className={cn(
                "h-14 rounded-xl font-bold text-xl uppercase transition-all duration-150",
                "shadow-[0_4px_0_rgba(30,33,39,1)] m-5",
                "active:translate-y-0.5 active:shadow-[0_2px_0_rgba(30,33,39,1)]",
                isUsed
                  ? "opacity-20 pointer-events-none grayscale bg-white/5 text-muted-foreground"
                  : "bg-[hsl(220,14%,30%)] text-white hover:bg-[hsl(220,14%,38%)]"
              )}
            >
              {char}
            </button>
          );
        })}
      </div>

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
