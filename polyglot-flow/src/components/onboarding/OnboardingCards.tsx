import { useState } from "react";
import { cn } from "@/lib/utils";
import { Layers, ArrowRight } from "lucide-react";

const CARD_OPTIONS = [
  { id: "5", label: "5 cards", description: "Leve, sem pressão", emoji: "🌱" },
  { id: "10", label: "10 cards", description: "Equilíbrio perfeito", emoji: "⚖️", recommended: true },
  { id: "20", label: "20 cards", description: "Progresso rápido", emoji: "🎯" },
  { id: "30", label: "30 cards", description: "Desafio diário", emoji: "💪" },
  { id: "50", label: "50 cards", description: "Modo intensivo", emoji: "🔥" },
];

interface Props {
  onNext: (data: { dailyCards: string }) => void;
}

export function OnboardingCards({ onNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-2">
          <Layers className="w-7 h-7 text-violet-400" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          Quantos <span className="text-violet-400">cards</span> por dia?
        </h2>
        <p className="text-sm text-muted-foreground/70">Cards de vocabulário para revisar diariamente</p>
      </div>

      <div className="space-y-3">
        {CARD_OPTIONS.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300",
              "hover:scale-[1.01] active:scale-[0.99]",
              selected === opt.id
                ? "bg-violet-500/10 border-violet-500/25 shadow-[0_0_30px_rgba(139,92,246,0.08)]"
                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className={cn("text-sm font-bold", selected === opt.id ? "text-foreground" : "text-foreground/80")}>
                  {opt.label}
                </p>
                {opt.recommended && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 uppercase tracking-wider font-bold">
                    Recomendado
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground/50 mt-0.5">{opt.description}</p>
            </div>

            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                selected === opt.id ? "border-violet-400 bg-violet-400" : "border-white/15"
              )}
            >
              {selected === opt.id && <div className="w-2 h-2 rounded-full bg-background" />}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => selected && onNext({ dailyCards: selected })}
        disabled={!selected}
        className={cn(
          "w-full py-4 rounded-xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2",
          selected
            ? "bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 hover:scale-[1.01]"
            : "bg-white/5 border border-white/5 text-muted-foreground/40 cursor-not-allowed"
        )}
      >
        Continuar
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
