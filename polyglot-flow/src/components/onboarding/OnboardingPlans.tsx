import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Crown, Zap, Sparkles, ArrowRight } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "R$ 0",
    period: "para sempre",
    features: [
      "50 frases capturadas/mês",
      "3 exercícios por dia",
      "1 conversa por semana",
      "Traduções básicas",
    ],
    icon: Zap,
    gradient: "from-white/5 to-white/5 border-white/10",
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 19,90",
    period: "/mês",
    features: [
      "Frases ilimitadas",
      "Exercícios ilimitados",
      "Conversas ilimitadas",
      "IA avançada (GPT-4)",
      "Exportar para Anki",
      "Suporte prioritário",
    ],
    icon: Crown,
    gradient: "from-primary/10 to-violet-600/10 border-primary/30",
    badge: "Popular",
  },
  {
    id: "team",
    name: "Team",
    price: "R$ 49,90",
    period: "/mês",
    features: [
      "Tudo do Pro",
      "Até 5 membros",
      "Dashboard de equipe",
      "Relatórios de progresso",
      "API de integração",
      "Onboarding dedicado",
    ],
    icon: Sparkles,
    gradient: "from-amber-500/10 to-orange-600/10 border-amber-500/30",
    badge: "Enterprise",
  },
];

interface Props {
  onNext: (data: { plan: string }) => void;
}

export function OnboardingPlans({ onNext }: Props) {
  const [selected, setSelected] = useState("free");

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-foreground">
          Escolha seu <span className="text-primary">plano</span>
        </h2>
        <p className="text-sm text-muted-foreground/70">Você pode mudar a qualquer momento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isActive = selected === plan.id;

          return (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={cn(
                "relative rounded-2xl border p-6 bg-gradient-to-br text-left transition-all duration-300",
                "hover:scale-[1.02] active:scale-[0.99]",
                plan.gradient,
                isActive && "ring-2 ring-primary/30 shadow-[0_0_40px_rgba(139,92,246,0.1)]"
              )}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {plan.badge}
                </span>
              )}

              <Icon
                className={cn(
                  "w-7 h-7 mb-4",
                  plan.id === "pro" ? "text-primary" : plan.id === "team" ? "text-amber-400" : "text-muted-foreground"
                )}
              />

              <h5 className="text-lg font-bold text-foreground">{plan.name}</h5>
              <div className="mt-1 mb-5">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-xs text-muted-foreground/60 ml-1">{plan.period}</span>
              </div>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground/80">
                    <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Radio indicator */}
              <div className="mt-5 pt-4 border-t border-white/5 flex justify-center">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    isActive
                      ? plan.id === "pro" ? "border-primary bg-primary" : plan.id === "team" ? "border-amber-400 bg-amber-400" : "border-emerald-400 bg-emerald-400"
                      : "border-white/15"
                  )}
                >
                  {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onNext({ plan: selected })}
        className="w-full max-w-lg mx-auto py-4 rounded-xl text-base font-bold bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
      >
        Finalizar
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
