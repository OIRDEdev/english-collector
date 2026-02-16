import { useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";

const TIME_OPTIONS = [
  { id: "5", label: "5 min", description: "Rápido e focado", emoji: "⚡" },
  { id: "15", label: "15 min", description: "Ideal para o dia a dia", emoji: "☕" },
  { id: "30", label: "30 min", description: "Aprendizado consistente", emoji: "📚", recommended: true },
  { id: "60", label: "1 hora", description: "Progresso acelerado", emoji: "🚀" },
  { id: "120", label: "2+ horas", description: "Imersão total", emoji: "🔥" },
];

interface Props {
  onNext: (data: { dailyMinutes: string }) => void;
}

export function OnboardingTime({ onNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-2">
          <Clock className="w-7 h-7 text-cyan-400" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          Quanto tempo por <span className="text-cyan-400">dia</span>?
        </h2>
        <p className="text-sm text-muted-foreground/70">Vamos personalizar seu ritmo de aprendizado</p>
      </div>

      <div className="space-y-3">
        {TIME_OPTIONS.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300",
              "hover:scale-[1.01] active:scale-[0.99]",
              selected === opt.id
                ? "bg-cyan-500/10 border-cyan-500/25 shadow-[0_0_30px_rgba(6,182,212,0.08)]"
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
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider font-bold">
                    Recomendado
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground/50 mt-0.5">{opt.description}</p>
            </div>

            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                selected === opt.id ? "border-cyan-400 bg-cyan-400" : "border-white/15"
              )}
            >
              {selected === opt.id && <div className="w-2 h-2 rounded-full bg-background" />}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => selected && onNext({ dailyMinutes: selected })}
        disabled={!selected}
        className={cn(
          "w-full py-4 rounded-xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2",
          selected
            ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 hover:scale-[1.01]"
            : "bg-white/5 border border-white/5 text-muted-foreground/40 cursor-not-allowed"
        )}
      >
        Continuar
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
