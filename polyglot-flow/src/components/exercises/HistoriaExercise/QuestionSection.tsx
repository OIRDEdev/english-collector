import React from "react";
import { CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Question, Phase } from "./types";

interface QuestionSectionProps {
  questionEntries: [string, Question][];
  phase: Phase;
  answers: Record<string, string>;
  results: Record<string, boolean>;
  clickTarget: string | null;
  clickedCorrect: Record<string, boolean>;
  questionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onAnswerChange: (key: string, value: string) => void;
  onActivateClick: (key: string) => void;
}

const QuestionSection = React.memo(function QuestionSection({
  questionEntries,
  phase,
  answers,
  results,
  clickTarget,
  clickedCorrect,
  questionRefs,
  onAnswerChange,
  onActivateClick,
}: QuestionSectionProps) {
  const isResult = phase === "results";

  return (
    <div className="space-y-6">
      {questionEntries.map(([key, q], index) => {
        const isCorrect = results[key];

        return (
          <div
            key={key}
            ref={(el) => (questionRefs.current[key] = el)}
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
              <p className="text-foreground font-medium leading-relaxed pt-1">{q.pergunta}</p>
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
                      onClick={() => !isResult && onAnswerChange(key, opt)}
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
                  onChange={(e) => onAnswerChange(key, e.target.value)}
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
                    onClick={() => onActivateClick(key)}
                    className={cn(
                      "border-violet-500/30 text-violet-400 hover:bg-violet-500/10",
                      clickTarget === key && "bg-violet-500/20 border-violet-500/50"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {clickTarget === key ? "Clique na parte do texto" : "Selecionar trecho no texto"}
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
  );
});

export default QuestionSection;
