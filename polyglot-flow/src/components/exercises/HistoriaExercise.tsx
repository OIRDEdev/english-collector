import { useState, useEffect, useCallback } from "react";
import { BookOpen, Timer, CheckCircle2, XCircle, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// ─── Types ───────────────────────────────────────────────────────

interface Question {
  pergunta: string;
  // Open-ended
  resposta?: string;
  // Multiple choice
  opcoes?: string[];
  resposta_correta?: string;
  // Click on text
  trecho_alvo?: string;
}

interface HistoriaData {
  texto: string;
  tempo_leitura?: number; // seconds — if missing, calculated from word count
  "perguntas do texto"?: Record<string, Question>;
  perguntas_do_texto?: Record<string, Question>;
}

interface HistoriaExerciseProps {
  data: HistoriaData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

type Phase = "reading" | "questions" | "results";

// ─── Component ───────────────────────────────────────────────────

export function HistoriaExercise({ data, onComplete, onExit }: HistoriaExerciseProps) {
  const [phase, setPhase] = useState<Phase>("reading");
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [clickTarget, setClickTarget] = useState<string | null>(null);
  const [clickedCorrect, setClickedCorrect] = useState<Record<string, boolean>>({});

  // Normalize the questions key (supports both formats)
  const questions = data["perguntas do texto"] ?? data.perguntas_do_texto ?? {};
  const questionEntries = Object.entries(questions);

  // Calculate reading time: provided or ~4 words/second
  const readingTime = data.tempo_leitura || Math.max(30, Math.ceil(data.texto.split(/\s+/).length / 4));

  useEffect(() => {
    setTimeLeft(readingTime);
  }, [readingTime]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "reading" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase("questions");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const timerProgress = (timeLeft / readingTime) * 100;

  // ─── Question Handlers ───

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // For "click on text" questions: activate text selection mode
  const activateClickMode = (key: string, trecho: string) => {
    setClickTarget(key);
  };

  const handleTextClick = (word: string, wordIndex: number) => {
    if (!clickTarget) return;

    const q = questions[clickTarget];
    if (!q?.trecho_alvo) return;

    // Check if the clicked word is part of the target phrase
    const targetWords = q.trecho_alvo.toLowerCase().split(/\s+/);
    const cleanWord = word.replace(/[.,!?;:'"()]/g, "").toLowerCase();

    if (targetWords.includes(cleanWord)) {
      // Mark as found
      setClickedCorrect((prev) => ({ ...prev, [clickTarget]: true }));
      setAnswers((prev) => ({ ...prev, [clickTarget]: q.trecho_alvo }));
      setClickTarget(null);
    }
  };

  // ─── Submit & Score ───

  const handleSubmit = () => {
    const newResults: Record<string, boolean> = {};
    let correct = 0;

    for (const [key, q] of questionEntries) {
      const answer = answers[key] || "";

      if (q.resposta_correta) {
        // Multiple choice
        const isCorrect = answer === q.resposta_correta;
        newResults[key] = isCorrect;
        if (isCorrect) correct++;
      } else if (q.trecho_alvo) {
        // Click on text
        const isCorrect = clickedCorrect[key] === true;
        newResults[key] = isCorrect;
        if (isCorrect) correct++;
      } else if (q.resposta) {
        // Open-ended — partial match (contains key phrases)
        const normalizedAnswer = answer.toLowerCase().trim();
        const normalizedCorrect = q.resposta.toLowerCase().trim();
        // Check if at least 30% of the correct answer's words appear
        const correctWords = normalizedCorrect.split(/\s+/);
        const matchCount = correctWords.filter((w) => normalizedAnswer.includes(w)).length;
        const isCorrect = matchCount / correctWords.length >= 0.3;
        newResults[key] = isCorrect;
        if (isCorrect) correct++;
      }
    }

    setResults(newResults);
    setPhase("results");

    const score = questionEntries.length > 0 ? Math.round((correct / questionEntries.length) * 100) : 100;
    setTimeout(() => onComplete(score), 3000);
  };

  const allAnswered = questionEntries.every(([key, q]) => {
    if (q.trecho_alvo) return clickedCorrect[key] === true;
    return !!answers[key];
  });

  // ─── Render: Reading Phase ───

  if (phase === "reading") {
    return (
      <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-6 space-y-8 min-h-[60vh]">
        {/* Header */}
        <div className="w-full flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold font-mono italic tracking-tighter">
              <span className="text-white">LEITURA</span>
              <span className="text-emerald-400">IMERSA</span>
            </h2>
            <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">
              Leia o texto com atenção
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-3 bg-card/40 backdrop-blur-md rounded-full px-5 py-2.5 border border-white/10">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className={cn(
              "text-lg font-bold font-mono tabular-nums",
              timeLeft <= 10 ? "text-red-400" : "text-emerald-400"
            )}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Timer Progress */}
        <Progress value={timerProgress} className="h-1 w-full" />

        {/* Text Content */}
        <div className="w-full bg-card/30 backdrop-blur-md rounded-2xl border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-line">
              {data.texto}
            </p>
          </div>
        </div>

        {/* Skip Button */}
        <Button
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          onClick={() => setPhase("questions")}
        >
          Já li — Ir para perguntas
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  // ─── Render: Questions Phase + Results Phase ───

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-6 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold font-mono italic tracking-tighter">
          <span className="text-white">{phase === "results" ? "RESULTADO" : "PERGUNTAS"}</span>
          <span className="text-violet-400"> DO TEXTO</span>
        </h2>
        <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">
          {phase === "results"
            ? `${Object.values(results).filter(Boolean).length}/${questionEntries.length} corretas`
            : "Responda com base no que você leu"}
        </p>
      </div>

      {/* Text Reference — always visible */}
      <div className={cn(
        "w-full bg-card/20 backdrop-blur-md rounded-2xl border p-6 max-h-72 min-h-[200px] overflow-auto flex-shrink-0 transition-all duration-300",
        clickTarget ? "border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]" : "border-white/5"
      )}>
        {clickTarget && (
          <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-3 animate-pulse">
            <MessageSquare className="w-3 h-3" />
            <span>Clique na palavra do trecho alvo no texto abaixo</span>
          </div>
        )}
        <p className="text-sm leading-relaxed text-foreground/80">
          {data.texto.split(/\s+/).map((word, i) => {
            const cleanWord = word.replace(/[.,!?;:'"()]/g, "").toLowerCase();

            // Check if any found target contains this word (for highlighting)
            const isFoundTarget = Object.entries(clickedCorrect).some(([qKey, found]) => {
              if (!found) return false;
              const q = questions[qKey];
              return q?.trecho_alvo?.toLowerCase().split(/\s+/).includes(cleanWord);
            });

            if (clickTarget) {
              return (
                <span
                  key={i}
                  onClick={() => handleTextClick(word, i)}
                  className={cn(
                    "cursor-pointer px-0.5 py-0.5 rounded transition-all inline-block",
                    "hover:bg-violet-400/20 hover:text-violet-300",
                    isFoundTarget && "bg-emerald-500/30 text-emerald-400"
                  )}
                >
                  {word}{" "}
                </span>
              );
            }

            return (
              <span
                key={i}
                className={cn(
                  "inline-block px-0.5",
                  isFoundTarget && "bg-emerald-500/20 text-emerald-400 rounded"
                )}
              >
                {word}{" "}
              </span>
            );
          })}
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questionEntries.map(([key, q], index) => {
          const isResult = phase === "results";
          const isCorrect = results[key];

          return (
            <div
              key={key}
              className={cn(
                "bg-card/30 backdrop-blur-md rounded-2xl border p-6 space-y-4 transition-all duration-300",
                isResult && isCorrect && "border-emerald-500/30 bg-emerald-500/5",
                isResult && !isCorrect && "border-red-500/30 bg-red-500/5",
                !isResult && "border-white/5"
              )}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <p className="text-foreground font-medium leading-relaxed pt-1">
                  {q.pergunta}
                </p>
                {isResult && (
                  isCorrect
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                    : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                )}
              </div>

              {/* Multiple Choice */}
              {q.opcoes && (
                <div className="space-y-2 pl-11">
                  {q.opcoes.map((opt, oi) => {
                    const isSelected = answers[key] === opt;
                    const isCorrectOpt = isResult && opt === q.resposta_correta;
                    const isWrongSelected = isResult && isSelected && opt !== q.resposta_correta;

                    return (
                      <button
                        key={oi}
                        onClick={() => !isResult && handleAnswerChange(key, opt)}
                        disabled={isResult}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 text-sm",
                          !isResult && isSelected && "border-violet-500/50 bg-violet-500/10 text-foreground",
                          !isResult && !isSelected && "border-white/5 bg-white/[0.02] hover:bg-white/5 text-muted-foreground hover:text-foreground",
                          isCorrectOpt && "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
                          isWrongSelected && "border-red-500/50 bg-red-500/10 text-red-400"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Open-ended */}
              {q.resposta && !q.opcoes && !q.trecho_alvo && (
                <div className="pl-11 space-y-2">
                  <textarea
                    value={answers[key] || ""}
                    onChange={(e) => handleAnswerChange(key, e.target.value)}
                    disabled={isResult}
                    placeholder="Escreva sua resposta..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none min-h-[80px] focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-60"
                  />
                  {isResult && (
                    <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resposta esperada:</p>
                      <p className="text-sm text-emerald-400">{q.resposta}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Click on Text */}
              {q.trecho_alvo && (
                <div className="pl-11 space-y-2">
                  {clickedCorrect[key] ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Trecho encontrado: <strong>&ldquo;{q.trecho_alvo}&rdquo;</strong></span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isResult}
                      onClick={() => activateClickMode(key, q.trecho_alvo!)}
                      className={cn(
                        "border-violet-500/30 text-violet-400 hover:bg-violet-500/10",
                        clickTarget === key && "bg-violet-500/20 border-violet-500/50"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {clickTarget === key ? "Clique no trecho no texto acima ↑" : "Selecionar trecho no texto"}
                    </Button>
                  )}
                  {isResult && !clickedCorrect[key] && (
                    <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trecho correto:</p>
                      <p className="text-sm text-emerald-400">&ldquo;{q.trecho_alvo}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {phase === "questions" && (
        <Button
          size="lg"
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold tracking-wide"
          onClick={handleSubmit}
          disabled={!allAnswered}
        >
          VERIFICAR RESPOSTAS
        </Button>
      )}
    </div>
  );
}
