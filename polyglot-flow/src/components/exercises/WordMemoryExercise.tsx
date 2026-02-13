import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Timer, Check, X as XIcon, Zap, Trophy } from "lucide-react";

interface WordPair {
  pt: string;
  en: string;
}

interface WordMemoryData {
  data: {
    wordList: WordPair[];
    timeLimit: number;
  }
}

interface WordMemoryProps {
  data: WordMemoryData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

type WordStatus = "pending" | "correct" | "wrong";

export function WordMemoryExercise({ data, onComplete, onExit }: WordMemoryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(data.data.timeLimit);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState<WordStatus[]>([]); 
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  console.log(data.data.wordList)
  console.log(data)
  const totalWords = data.data.wordList.length;
  const correctCount = results.filter((r) => r === "correct").length;
  const answeredCount = results.filter((r) => r !== "pending").length;
  const currentWord = data.data.wordList[currentIndex];

  // Timer
  useEffect(() => {
    if (!isStarted || isFinished) return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, isFinished, timeLeft]);

  // Auto-focus
  useEffect(() => {
    if (isStarted && !isFinished) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isStarted, feedback]);

  const finish = useCallback(() => {
    setIsFinished(true);
    const score = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;
    setTimeout(() => onComplete(score), 2000);
  }, [correctCount, totalWords, onComplete]);

  const handleSubmit = () => {
    if (!input.trim() || isFinished || feedback) return;

    const answer = input.trim().toLowerCase();
    const expected = currentWord.en.toLowerCase();
    const isCorrect = answer === expected;

    const newResults = [...results];
    newResults[currentIndex] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    if (isCorrect) {
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    setFeedback(isCorrect ? "correct" : "wrong");

    // Brief delay before moving to next word
    setTimeout(() => {
      setFeedback(null);
      setInput("");

      if (currentIndex + 1 < totalWords) {
        setCurrentIndex((i) => i + 1);
      } else {
        finish();
      }
    }, isCorrect ? 600 : 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isStarted) {
        setIsStarted(true);
      } else {
        handleSubmit();
      }
    }
  };

  const progressPercent = totalWords > 0 ? (answeredCount / totalWords) * 100 : 0;
  const timePercent = data.data.timeLimit > 0 ? (timeLeft / data.data.timeLimit) * 100 : 100;

  // Start screen
  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto gap-8 text-center">
        <div>
          <h2 className="text-3xl font-bold font-mono italic tracking-tighter">
            <span className="text-foreground">WORD</span>
            <span className="text-fuchsia-400">MEMORY</span>
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">
            Tradução Relâmpago
          </p>
        </div>

        <div className="bg-card/20 backdrop-blur-md border border-white/5 rounded-2xl p-8 space-y-6 w-full">
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-fuchsia-400" />
              {totalWords} palavras
            </span>
            <span className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-fuchsia-400" />
              {data.data.timeLimit}s
            </span>
          </div>

          <p className="text-muted-foreground/80 text-sm leading-relaxed">
            Traduza cada palavra do <strong className="text-fuchsia-300">português</strong> para o <strong className="text-fuchsia-300">inglês</strong>.
            <br />
            Quanto mais rápido, melhor a pontuação!
          </p>

          <button
            onClick={() => setIsStarted(true)}
            onKeyDown={handleKeyDown}
            className="w-full py-4 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 font-bold text-lg hover:bg-fuchsia-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Começar
          </button>
        </div>
      </div>
    );
  }

  // Finished screen (briefly shown before result modal)
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

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono italic tracking-tighter">
            <span className="text-foreground">WORD</span>
            <span className="text-fuchsia-400">MEMORY</span>
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Tradução Relâmpago
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak */}
          {streak > 1 && (
            <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 animate-in zoom-in-90 duration-300">
              <span className="text-xs font-bold text-orange-400">🔥 {streak}</span>
            </div>
          )}

          {/* Timer */}
          <div
            className={cn(
              "px-4 py-2 rounded-xl border flex items-center gap-2",
              timeLeft <= 10
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-300"
            )}
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="text-sm font-bold font-mono">{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Counter */}
      <div className="text-center text-xs text-muted-foreground/60">
        {answeredCount + 1} / {totalWords}
      </div>

      {/* Word Card */}
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
          <div className={cn(
            "absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200",
            feedback === "correct" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          )}>
            {feedback === "correct" ? <Check className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
          </div>
        )}

        <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-4">
          Traduza para inglês
        </p>

        <p className={cn(
          "text-5xl font-bold tracking-tight transition-all duration-300",
          feedback === "correct" && "text-emerald-300",
          feedback === "wrong" && "text-red-300",
          !feedback && "text-fuchsia-300"
        )}>
          {currentWord.pt}
        </p>

        {/* Show correct answer on wrong */}
        {feedback === "wrong" && (
          <p className="mt-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
            Resposta correta: <strong className="text-foreground">{currentWord.en}</strong>
          </p>
        )}
      </div>

      {/* Input */}
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!!feedback}
          placeholder="Type the translation..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            "w-full py-4 px-6 rounded-2xl bg-card/30 backdrop-blur-md border text-foreground text-center text-lg font-medium",
            "placeholder:text-muted-foreground/30 focus:outline-none transition-all duration-300",
            feedback
              ? "opacity-50 cursor-not-allowed border-white/5"
              : "border-white/10 focus:border-fuchsia-500/40 focus:shadow-[0_0_20px_rgba(217,70,239,0.1)]"
          )}
        />
        <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          Pressione Enter para confirmar
        </p>
      </div>

      {/* Time bar at bottom */}
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            timeLeft <= 10 ? "bg-red-500" : "bg-fuchsia-500/60"
          )}
          style={{ width: `${timePercent}%` }}
        />
      </div>
    </div>
  );
}
