import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ClarityData {
  id: number;
  instrucao: string;
  texto_completo: string;
  palavras_erradas: string[];
  tempo_leitura: number;
  dificuldade: string;
}

interface ClarityExerciseProps {
  data: ClarityData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function ClarityExercise({ data, onComplete, onExit }: ClarityExerciseProps) {
  const [words, setWords] = useState<{ text: string; id: number; removed: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(data.tempo_leitura);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  console.log(data);
  useEffect(() => {
    console.log(data);
    const splitWords = data.texto_completo.split(" ").map((w, i) => ({
      text: w,
      id: i,
      removed: false,
    }));
    setWords(splitWords);
    setIsActive(true);
  }, [data]);

  useEffect(() => {
    if (!isActive || isFinished) return;

    if (timeLeft <= 0) {
      finishExercise();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, isFinished]);

  const toggleWord = (id: number) => {
    if (isFinished) return;
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, removed: !w.removed } : w))
    );
  };

  const finishExercise = () => {
    setIsFinished(true);
    setIsActive(false);

    // Calculate score
    const removedWords = words.filter((w) => w.removed).map((w) => w.text.replace(/[.,!?;:]/g, ""));
    const correctRemovals = removedWords.filter((w) => data.palavras_erradas.includes(w));
    const wrongRemovals = removedWords.filter((w) => !data.palavras_erradas.includes(w));
    const missedRemovals = data.palavras_erradas.filter((w) => !removedWords.includes(w));

    // Simple score logic: +1 for correct removal, -1 for wrong removal
    let score = correctRemovals.length - wrongRemovals.length;
    
    // Normalize score to 0-100
    // Max possible score = total words to remove
    const maxScore = data.palavras_erradas.length;
    const finalScore = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));

    setTimeout(() => onComplete(finalScore), 2000); // Wait a bit to show results
  };

  const currentRemovedCount = words.filter(w => w.removed).length;
  const targetCount = data.palavras_erradas.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-3xl mx-auto p-6 space-y-12">
      {/* Header / Timer */}
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            CLARITY SPRINT
          </h2>
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">
            {data.instrucao}
          </p>
        </div>
        
        <div className="relative w-16 h-16 flex items-center justify-center">
             {/* Circular Timer Mockup using SVG */}
            <svg className="w-full h-full -rotate-90">
                <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor" strokeWidth="4"
                    fill="transparent"
                    className="text-muted/20"
                />
                <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor" strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - timeLeft / data.tempo_leitura)}
                    className={cn(
                        "text-amber-500 transition-all duration-1000 ease-linear",
                        timeLeft < 5 && "text-red-500"
                    )}
                />
            </svg>
            <span className="absolute text-lg font-bold font-mono">{timeLeft}</span>
        </div>
      </div>

      {/* Sentence Area */}
      <div className="w-full bg-card/40 backdrop-blur-md rounded-2xl border border-white/5 p-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-wrap gap-3 justify-center items-center relative z-10 min-h-[120px]">
          {words.map((word) => {
            const isTarget = data.palavras_erradas.includes(word.text.replace(/[.,!?;:]/g, ""));
            
            // Result styling
            let resultClass = "";
            if (isFinished) {
               if (word.removed && isTarget) resultClass = "text-green-500 line-through decoration-green-500 decoration-4"; // Correctly removed
               else if (word.removed && !isTarget) resultClass = "text-red-500 line-through decoration-red-500 decoration-4 bg-red-500/10"; // Wrongly removed
               else if (!word.removed && isTarget) resultClass = "text-yellow-500 border-yellow-500 border-b-2 border-dashed"; // Missed target
            }

            return (
              <button
                key={word.id}
                onClick={() => toggleWord(word.id)}
                disabled={isFinished}
                className={cn(
                  "px-1 py-0.5 rounded text-xl font-medium transition-all duration-200 select-none border-b-2 border-transparent",
                  !isFinished && !word.removed && "hover:bg-amber-500/10 hover:border-amber-500/30 text-foreground cursor-pointer hover:-translate-y-0.5",
                  !isFinished && word.removed && "text-muted-foreground/40 line-through decoration-amber-500/50 decoration-2",
                  resultClass
                )}
              >
                {word.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress / Controls */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex justify-between text-sm text-muted-foreground px-1">
             <span>Palavras removidas: {currentRemovedCount}</span>
             <span>Meta: {targetCount}</span>
        </div>
        <Progress value={(currentRemovedCount / targetCount) * 100} className="h-1" />
        
        {!isFinished && (
            <Button 
                size="lg" 
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold tracking-wide"
                onClick={() => finishExercise()}
            >
                VERIFICAR
            </Button>
        )}
      </div>
    </div>
  );
}
