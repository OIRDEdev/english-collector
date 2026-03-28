import React from "react";
import { Timer, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ReadingPhaseProps {
  texto: string;
  timeLeft: number;
  timerProgress: number;
  formatTime: (s: number) => string;
  onSkip: () => void;
}

const ReadingPhase = React.memo(function ReadingPhase({
  texto,
  timeLeft,
  timerProgress,
  formatTime,
  onSkip,
}: ReadingPhaseProps) {
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

        {/* Timer — isolated inside this component; no siblings re-render */}
        <div className="flex items-center gap-3 bg-card/40 backdrop-blur-md rounded-full px-5 py-2.5 border border-white/10">
          <Timer className="w-4 h-4 text-emerald-400" />
          <span
            className={cn(
              "text-xl font-bold font-mono tabular-nums",
              timeLeft <= 10 ? "text-red-400" : "text-emerald-400"
            )}
          >
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
          <p className="text-sm md:text-xl leading-relaxed text-foreground/90 whitespace-pre-line">
            {texto}
          </p>
        </div>
      </div>

      {/* Skip Button */}
      <Button
        variant="outline"
        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        onClick={onSkip}
      >
        Já li — Ir para perguntas
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
});

export default ReadingPhase;
