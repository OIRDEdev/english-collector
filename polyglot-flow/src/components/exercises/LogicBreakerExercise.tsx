import { useState, useEffect } from "react";
import { Heart, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogicBreakerData {
  id?: number;
  instrucao: string;
  texto: string;
  palavra_alvo: string;
}

interface LogicBreakerExerciseProps {
  data: LogicBreakerData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function LogicBreakerExercise({ data, onComplete, onExit }: LogicBreakerExerciseProps) {
  const [words, setWords] = useState<{ text: string; clean: string; id: number }[]>([]);
  const [lives, setLives] = useState(3);
  const [found, setFound] = useState(false);
  const [clickedWrong, setClickedWrong] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const splitWords = data.texto.split(" ").map((w, i) => ({
      text: w,
      clean: w.replace(/[.,!?;:'"()]/g, "").toLowerCase(),
      id: i,
    }));
    setWords(splitWords);
  }, [data]);

  const handleWordClick = (word: { text: string; clean: string; id: number }) => {
    if (isFinished || found) return;

    if (word.clean === data.palavra_alvo.toLowerCase()) {
      // Found the logic flaw!
      setFound(true);
      setIsFinished(true);
      const score = lives === 3 ? 100 : lives === 2 ? 75 : 50;
      setTimeout(() => onComplete(score), 1800);
    } else {
      // Wrong click — lose a life
      setClickedWrong(word.id);
      const newLives = lives - 1;
      setLives(newLives);

      setTimeout(() => setClickedWrong(null), 500);

      if (newLives <= 0) {
        setIsFinished(true);
        setTimeout(() => onComplete(0), 1500);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-3xl mx-auto p-6 space-y-12">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold font-mono italic tracking-tighter">
            <span className="text-white">LOGIC</span>
            <span className="text-cyan-400">BREAKER</span>
          </h2>
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">
            {data.instrucao}
          </p>
        </div>

        {/* Lives */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={cn(
                "w-6 h-6 transition-all duration-300",
                i < lives
                  ? "text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                  : "text-muted/30 scale-90"
              )}
            />
          ))}
        </div>
      </div>

      {/* Sentence Area */}
      <div className="w-full bg-card/40 backdrop-blur-md rounded-[2rem] border border-white/5 p-10 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-wrap gap-x-2 gap-y-3 justify-center items-center relative z-10 min-h-[120px]">
          {words.map((word) => {
            const isTarget = word.clean === data.palavra_alvo.toLowerCase();
            const isCorrectlyFound = found && isTarget;
            const isWrongClick = clickedWrong === word.id;

            return (
              <button
                key={word.id}
                onClick={() => handleWordClick(word)}
                disabled={isFinished}
                className={cn(
                  "px-1.5 py-1 rounded-md text-xl font-medium transition-all duration-200 select-none",
                  // Default
                  !isFinished && !isWrongClick &&
                    "text-foreground cursor-pointer hover:bg-cyan-400/15 hover:text-cyan-300 hover:-translate-y-0.5",
                  // Found the target
                  isCorrectlyFound &&
                    "bg-emerald-500 text-white scale-110 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.5)]",
                  // Wrong click animation
                  isWrongClick &&
                    "text-red-400 animate-[shake_0.4s_ease-in-out]",
                  // Game over — highlight the target word the user missed
                  isFinished && !found && isTarget &&
                    "text-yellow-400 border-b-2 border-yellow-400 border-dashed",
                  // Game over — gray everything else
                  isFinished && !isTarget && !isCorrectlyFound &&
                    "text-muted-foreground/50"
                )}
              >
                {word.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-muted-foreground/60 text-sm italic">
        <AlertTriangle className="w-4 h-4" />
        <span>Uma palavra nesta frase inverte completamente o sentido lógico.</span>
      </div>

      {/* Game Over / Win Message */}
      {isFinished && (
        <div className={cn(
          "text-center animate-in fade-in slide-in-from-bottom-4 duration-500",
          found ? "text-emerald-400" : "text-red-400"
        )}>
          <p className="text-2xl font-bold font-mono">
            {found ? "Lógica Restaurada!" : "Sem vidas!"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {found
              ? `A palavra "${data.palavra_alvo}" quebrava a lógica.`
              : `A palavra correta era "${data.palavra_alvo}".`}
          </p>
        </div>
      )}
    </div>
  );
}
