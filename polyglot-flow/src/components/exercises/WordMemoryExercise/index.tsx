import { Zap, Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWordMemory } from "./useWordMemory";
import Flashcard from "./components/Flashcard";
import MemoryInput from "./components/MemoryInput";
import ExerciseHeader from "../Shared/ExerciseHeader";
import type { WordMemoryProps } from "./types";

export function WordMemoryExercise({ data, onComplete }: WordMemoryProps) {
  const {
    currentIndex, input, setInput,
    timeLeft, isStarted, setIsStarted,
    isFinished, feedback, streak, bestStreak,
    totalWords, correctCount, answeredCount,
    currentWord, progressPercent, timePercent,
    handleSubmit,
  } = useWordMemory(data, onComplete);

  // 1. Start Screen
  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto gap-8 text-center">
        <div>
          <h2 className="text-3xl font-bold font-mono italic tracking-tighter">
            <span className="text-foreground">WORD</span>
            <span className="text-fuchsia-400">MEMORY</span>
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">Tradução Relâmpago</p>
        </div>
        <div className="bg-card/20 backdrop-blur-md border border-white/5 rounded-2xl p-8 space-y-6 w-full">
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-fuchsia-400" /> {totalWords} palavras</span>
            <span className="flex items-center gap-2"><Timer className="w-4 h-4 text-fuchsia-400" /> {data.data.timeLimit}s</span>
          </div>
          <p className="text-muted-foreground/80 text-sm leading-relaxed">
            Traduza cada palavra do <strong className="text-fuchsia-300">português</strong> para o <strong className="text-fuchsia-300">inglês</strong>.<br />
            Quanto mais rápido, melhor a pontuação!
          </p>
          <button
             onClick={() => { setIsStarted(true); }}
             onKeyDown={(e) => { if (e.key === "Enter") setIsStarted(true); }}
             className="w-full py-4 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 font-bold text-lg hover:bg-fuchsia-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
             Começar
          </button>
        </div>
      </div>
    );
  }

  // 2. Finished Screen
  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto gap-6 text-center animate-in fade-in zoom-in-90 duration-500">
        <Trophy className="w-16 h-16 text-fuchsia-400" />
        <h2 className="text-2xl font-bold">Exercício completo!</h2>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{correctCount}</strong>/{totalWords} corretas</span>
          <span>🔥 Melhor sequência: <strong className="text-foreground">{bestStreak}</strong></span>
          <span>⏱️ {data.data.timeLimit - timeLeft}s</span>
        </div>
      </div>
    );
  }

  // 3. Game Screen
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-6">
      <ExerciseHeader
        title="WORD"
        accent="MEMORY"
        accentColor="text-fuchsia-400"
        subtitle="Tradução Relâmpago"
        right={
          <>
            {streak > 1 && (
              <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 animate-in zoom-in-90 duration-300">
                <span className="text-xs font-bold text-orange-400">🔥 {streak}</span>
              </div>
            )}
            <div className={cn("px-4 py-2 rounded-xl border flex items-center gap-2", timeLeft <= 10 ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-300")}>
              <Timer className="w-3.5 h-3.5" />
              <span className="text-sm font-bold font-mono">{timeLeft}s</span>
            </div>
          </>
        }
      />

      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
      </div>
      
      <div className="text-center text-xs text-muted-foreground/60">{answeredCount + 1} / {totalWords}</div>

      <Flashcard currentWord={currentWord} feedback={feedback} />

      <MemoryInput
        input={input}
        setInput={setInput}
        feedback={feedback}
        onSubmit={handleSubmit}
        currentIndex={currentIndex}
        isStarted={isStarted}
      />

      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000 ease-linear", timeLeft <= 10 ? "bg-red-500" : "bg-fuchsia-500/60")} style={{ width: `${timePercent}%` }} />
      </div>
    </div>
  );
}
