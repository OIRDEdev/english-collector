import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Send, RotateCcw, Sparkles } from "lucide-react";
import { exerciseService } from "@/services/exerciseService";

interface ChainExerciseData {
  instrucao: string;
  palavra_inicial: string;
}

interface ChainExerciseProps {
  data: ChainExerciseData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

interface WordEntry {
  text: string;
  from: "user" | "ai" | "initial";
}

export function ChainExercise({ data, onComplete, onExit }: ChainExerciseProps) {
  const [words, setWords] = useState<WordEntry[]>([
    { text: data.palavra_inicial, from: "initial" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentenceRef = useRef<HTMLDivElement>(null);
  console.log(data);
  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  // Auto-scroll sentence area
  useEffect(() => {
    if (sentenceRef.current) {
      sentenceRef.current.scrollTop = sentenceRef.current.scrollHeight;
    }
  }, [words]);

  const getSentence = (wordList: WordEntry[]) =>
    wordList.map((w) => w.text).join(" ");

  const handleSubmit = async () => {
    const word = input.trim();
    if (!word || loading || isFinished) return;

    // Only allow a single word
    if (word.includes(" ")) return;

    const newWords: WordEntry[] = [...words, { text: word, from: "user" }];
    setWords(newWords);
    setInput("");
    setTurnCount((t) => t + 1);

    // Check if sentence is long enough and ends with punctuation → finish
    const lastChar = word[word.length - 1];
    if (".!?".includes(lastChar) && newWords.length >= 6) {
      setIsFinished(true);
      // Score based on sentence length (more words = better)
      const score = Math.min(100, Math.round((newWords.length / 16) * 100));
      setTimeout(() => onComplete(score), 1500);
      return;
    }

    // Ask AI for next word
    setLoading(true);
    try {
      const sentence = getSentence(newWords);
      const resp = await exerciseService.chainNextWord(sentence);
      const aiWord = resp.nextword;

      const withAi: WordEntry[] = [...newWords, { text: aiWord, from: "ai" }];
      setWords(withAi);
      setTurnCount((t) => t + 1);

      // Check if AI ended the sentence
      const aiLastChar = aiWord[aiWord.length - 1];
      if (".!?".includes(aiLastChar) && withAi.length >= 6) {
        setIsFinished(true);
        const score = Math.min(100, Math.round((withAi.length / 16) * 100));
        setTimeout(() => onComplete(score), 1500);
      }
    } catch (error) {
      console.error("Chain AI error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRestart = () => {
    setWords([{ text: data.palavra_inicial, from: "initial" }]);
    setInput("");
    setIsFinished(false);
    setTurnCount(0);
    setLoading(false);
  };

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

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
            <span className="text-xs font-mono text-muted-foreground">LEVEL: </span>
            <span className="text-sm font-bold text-cyan-400 font-mono">{Math.floor(turnCount / 4) + 1}</span>
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div className="text-sm text-muted-foreground/80 bg-card/20 backdrop-blur-sm border border-white/5 rounded-xl px-5 py-3">
        <Sparkles className="w-3.5 h-3.5 inline-block mr-2 text-cyan-400" />
        {data.instrucao}
      </div>

      {/* Sentence Area */}
      <div
        ref={sentenceRef}
        className={cn(
          "relative rounded-2xl border bg-card/20 backdrop-blur-md p-8 min-h-[240px] max-h-[360px] overflow-auto transition-all duration-500",
          isFinished
            ? "border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            : "border-white/5"
        )}
      >
        <div className="flex flex-wrap gap-2.5 items-center">
          {words.map((word, i) => (
            <span
              key={i}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 animate-in fade-in zoom-in-90",
                word.from === "initial" &&
                  "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]",
                word.from === "user" &&
                  "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20",
                word.from === "ai" &&
                  "bg-violet-500/15 text-violet-300 border border-violet-500/20"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {word.text}
            </span>
          ))}

          {/* Loading indicator */}
          {loading && (
            <span className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 animate-pulse">
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            </span>
          )}
        </div>

        {/* Finished overlay */}
        {isFinished && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-2xl">
            <div className="text-center space-y-3 animate-in zoom-in-90 duration-500">
              <div className="text-4xl">🎉</div>
              <p className="text-lg font-bold text-emerald-400">Frase completa!</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                "{getSentence(words)}"
              </p>
            </div>
          </div>
        )}
      </div>

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

      {/* Input */}
      {!isFinished && (
        <div className="space-y-2">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                // Remove spaces — only single words allowed
                const val = e.target.value.replace(/\s/g, "");
                setInput(val);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Next word..."
              className={cn(
                "w-full py-4 px-6 pr-14 rounded-2xl bg-card/30 backdrop-blur-md border text-foreground text-center text-lg font-medium",
                "placeholder:text-muted-foreground/40 focus:outline-none transition-all duration-300",
                loading
                  ? "border-violet-500/20 opacity-50 cursor-not-allowed"
                  : "border-white/10 focus:border-cyan-500/40 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
              )}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                input.trim() && !loading
                  ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                  : "text-muted-foreground/30"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground/50 uppercase tracking-widest">
            Pressione Enter para enviar
          </p>
        </div>
      )}

      {/* Restart button */}
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
