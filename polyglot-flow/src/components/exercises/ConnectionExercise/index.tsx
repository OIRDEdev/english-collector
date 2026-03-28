import { Timer, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectionLogic } from "./useConnectionLogic";
import SentenceGap from "./components/SentenceGap";
import SelectorWheel from "./components/SelectorWheel";
import type { ConnectionProps } from "./types";

export function ConnectionExercise({ data, onComplete, onExit }: ConnectionProps) {
  const { connector, sentence, time, answer } = data.data;
  const timeLimit = parseInt(time, 10) || 120;
  const parts = sentence.split("______");
  const beforeBlank = parts[0] || "";
  const afterBlank = parts.slice(1).join("______") || "";

  const {
    selectedIndex, confirmed, timeLeft, isStarted,
    shuffled, selectedWord, isCorrect,
    setIsStarted, setSelectedIndex,
    handleConfirm, handleScroll, formatTime,
  } = useConnectionLogic({ connectors: connector, correctAnswer: answer, timeLimit, onComplete });

  // ── Start screen ──
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
              <Sparkles className="w-4 h-4 text-lime-400" /> {connector.length} opções
            </span>
            <span className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-lime-400" /> {formatTime(timeLimit)}
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

  // ── Game screen ──
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto gap-6">
      {/* Header + Timer */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono italic tracking-tighter">
          <span className="text-foreground">CONNECT</span>
          <span className="text-lime-400">ION</span>
        </h2>
        <div className={cn(
          "px-4 py-2 rounded-xl border flex items-center gap-2",
          timeLeft <= 15
            ? "border-red-500/30 bg-red-500/10 text-red-400"
            : "border-lime-500/20 bg-lime-500/5 text-lime-300"
        )}>
          <Timer className="w-3.5 h-3.5" />
          <span className="text-sm font-bold font-mono">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Sentence with gap — memoized */}
      <SentenceGap
        beforeBlank={beforeBlank}
        afterBlank={afterBlank}
        selectedWord={selectedWord}
        confirmed={confirmed}
        isCorrect={isCorrect}
        correctAnswer={answer}
      />

      {/* Selector wheel — memoized */}
      {!confirmed && (
        <SelectorWheel
          shuffled={shuffled}
          selectedIndex={selectedIndex}
          confirmed={confirmed}
          onScroll={handleScroll}
          onSelect={setSelectedIndex}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
