import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Timer, ChevronUp, ChevronDown, Check, Sparkles } from "lucide-react";

interface ConnectionData {
  data: {
    connector: string[];
    sentence: string;
    time: string;
    answer: string;
  };
}

interface ConnectionProps {
  data: ConnectionData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function ConnectionExercise({ data, onComplete, onExit }: ConnectionProps) {
  const { connector, sentence, time } = data.data;
  const timeLimit = parseInt(time, 10) || 120;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isStarted, setIsStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // The correct answer is always the first connector in the array
  const correctAnswer = data.data.answer;
  // Shuffle connectors for display
  const [shuffled] = useState(() => {
    const arr = [...connector];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const selectedWord = shuffled[selectedIndex];
  const isCorrect = selectedWord === correctAnswer;

  // Split sentence around ______
  const parts = sentence.split("______");
  const beforeBlank = parts[0] || "";
  const afterBlank = parts.slice(1).join("______") || "";

  // Timer
  useEffect(() => {
    if (!isStarted || confirmed) return;
    if (timeLeft <= 0) {
      handleConfirm();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isStarted, confirmed, timeLeft]);

  // Keyboard navigation
  useEffect(() => {
    if (!isStarted || confirmed) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : shuffled.length - 1));
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((i) => (i < shuffled.length - 1 ? i + 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isStarted, confirmed, selectedIndex]);

  const handleConfirm = () => {
    if (confirmed) return;
    setConfirmed(true);
    setShowResult(true);

    const score = isCorrect ? 100 : 0;
    setTimeout(() => onComplete(score), 2500);
  };

  const handleScroll = (direction: "up" | "down") => {
    if (confirmed) return;
    if (direction === "up") {
      setSelectedIndex((i) => (i > 0 ? i - 1 : shuffled.length - 1));
    } else {
      setSelectedIndex((i) => (i < shuffled.length - 1 ? i + 1 : 0));
    }
  };

  // Touch/scroll on selector
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 30) {
      handleScroll(diff > 0 ? "down" : "up");
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Start screen
  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto gap-8 text-center">
        <div>
          <h2 className="text-3xl font-bold font-mono italic tracking-tighter">
            <span className="text-foreground">CONNECT</span>
            <span className="text-lime-400">ION</span>
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">
            Fill the gap with the right connector
          </p>
        </div>

        <div className="bg-card/20 backdrop-blur-md border border-white/5 rounded-2xl p-8 space-y-6 w-full">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" />
              {connector.length} opções
            </span>
            <span className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-lime-400" />
              {formatTime(timeLimit)}
            </span>
          </div>

          <p className="text-muted-foreground/80 text-sm leading-relaxed">
            Leia o texto e escolha o <strong className="text-lime-300">conector</strong> correto para completar a frase.
          </p>

          <button
            onClick={() => setIsStarted(true)}
            className="w-full py-4 rounded-xl bg-lime-500/20 border border-lime-500/30 text-lime-300 font-bold text-lg hover:bg-lime-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Começar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono italic tracking-tighter">
            <span className="text-foreground">CONNECT</span>
            <span className="text-lime-400">ION</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className={cn(
              "px-4 py-2 rounded-xl border flex items-center gap-2",
              timeLeft <= 15
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-lime-500/20 bg-lime-500/5 text-lime-300"
            )}
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="text-sm font-bold font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Text Card */}
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
            {confirmed ? selectedWord : selectedWord}
          </span>
          {afterBlank}
        </p>

        {/* Result feedback */}
        {confirmed && (
          <div className={cn(
            "mt-6 pt-4 border-t animate-in fade-in slide-in-from-bottom-2 duration-500",
            isCorrect ? "border-emerald-500/20" : "border-red-500/20"
          )}>
            {isCorrect ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Perfeito!</span>
                <span className="text-sm text-muted-foreground ml-2">
                  "{correctAnswer}" é o conector correto.
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-red-400 font-semibold">Não é essa...</p>
                <p className="text-sm text-muted-foreground">
                  O conector correto era: <strong className="text-foreground">{correctAnswer}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connector Selector */}
      {!confirmed && (
        <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">
            Escolha o conector
          </p>

          {/* Scroll selector */}
          <div
            ref={selectorRef}
            className="relative w-full max-w-sm"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Up arrow */}
            <button
              onClick={() => handleScroll("up")}
              className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-card/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-lime-500/30 transition-all"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Options */}
            <div className="py-6 space-y-2">
              {shuffled.map((word, i) => {
                const isSelected = i === selectedIndex;
                const distance = Math.abs(i - selectedIndex);

                return (
                  <button
                    key={word}
                    onClick={() => setSelectedIndex(i)}
                    className={cn(
                      "w-full py-3 px-6 rounded-xl text-center transition-all duration-300",
                      isSelected
                        ? "bg-lime-500/15 border-2 border-lime-500/40 text-lime-300 text-lg font-bold scale-105 shadow-[0_0_20px_rgba(132,204,22,0.1)]"
                        : "bg-card/10 border border-white/5 text-muted-foreground/50 hover:text-muted-foreground hover:border-white/10",
                      distance === 1 && !isSelected && "opacity-60 text-sm",
                      distance >= 2 && !isSelected && "opacity-30 text-xs"
                    )}
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            {/* Down arrow */}
            <button
              onClick={() => handleScroll("down")}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-card/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-lime-500/30 transition-all"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            className="mt-4 w-full max-w-sm py-4 rounded-xl bg-lime-500/20 border border-lime-500/30 text-lime-300 font-bold text-base hover:bg-lime-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Confirmar
          </button>

          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
            ↑↓ para navegar • Enter para confirmar
          </p>
        </div>
      )}
    </div>
  );
}
