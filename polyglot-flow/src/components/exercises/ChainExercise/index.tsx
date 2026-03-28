import { RotateCcw, Sparkles } from "lucide-react";
import { useChainExercise } from "./useChainExercise";
import SentenceDisplay from "./components/SentenceDisplay";
import WordInput from "./components/WordInput";
import type { ChainExerciseProps } from "./types";

export function ChainExercise({ data, onComplete, onExit }: ChainExerciseProps) {
  const {
    words, loading, isFinished, turnCount,
    inputRef, sentenceRef,
    getSentence, handleSubmit, handleRestart,
  } = useChainExercise(data, onComplete);

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-mono italic tracking-tighter">
            <span className="text-foreground">SENTENCE</span>
            <span className="text-cyan-400">BUILDER</span>
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Co-op Syntax Training
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <span className="text-xs font-mono text-muted-foreground">LEVEL: </span>
          <span className="text-sm font-bold text-cyan-400 font-mono">
            {Math.floor(turnCount / 4) + 1}
          </span>
        </div>
      </div>

      {/* Instruction */}
      <div className="text-sm text-muted-foreground/80 bg-card/20 backdrop-blur-sm border border-white/5 rounded-xl px-5 py-3">
        <Sparkles className="w-3.5 h-3.5 inline-block mr-2 text-cyan-400" />
        {data.instrucao}
      </div>

      {/* Word bubbles — memoized, doesn't re-render on keystroke */}
      <SentenceDisplay
        words={words}
        loading={loading}
        isFinished={isFinished}
        getSentence={getSentence}
        containerRef={sentenceRef}
      />

      {/* Legend */}
      <div className="flex items-center gap-6 justify-center text-xs text-muted-foreground/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-cyan-500/20 border border-cyan-500/30" />
          Suas palavras
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-violet-500/15 border border-violet-500/20" />
          Palavras da IA
        </span>
      </div>

      {/* Input — has its own state, never triggers SentenceDisplay re-render */}
      {!isFinished && (
        <WordInput loading={loading} onSubmit={handleSubmit} inputRef={inputRef} />
      )}

      {/* Restart */}
      {isFinished && (
        <button
          onClick={handleRestart}
          className="mx-auto flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-card/20 text-sm text-muted-foreground hover:text-foreground hover:border-cyan-500/30 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
