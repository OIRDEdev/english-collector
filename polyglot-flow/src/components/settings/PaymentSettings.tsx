import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Crown, Zap, Sparkles, CreditCard, CalendarDays } from "lucide-react";

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

export function PaymentSettings() {
  const [currentPlan] = useState("free");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center gap-2 mb-4">
          <CreditCard className="w-3.5 h-3.5" />
          Plano atual
        </h4>

        <div className="bg-card/20 border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Zap className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Free</p>
              <p className="text-xs text-muted-foreground/60">Plano gratuito</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-muted-foreground border border-white/10">
            Ativo
          </span>
        </div>
      </section>

      {/* Billing Cycle Toggle */}
      <section>
        <div className="flex items-center justify-center gap-1 bg-card/20 border border-white/5 rounded-xl p-1.5 max-w-xs mx-auto">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
              billingCycle === "monthly"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
              billingCycle === "yearly"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Anual
            <span className="text-[10px] text-emerald-400 font-bold">-20%</span>
          </button>
        </div>
      </section>

      {/* Plans Grid */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold mb-4">
          Planos disponíveis
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isActive = currentPlan === plan.id;
            const displayPrice = billingCycle === "yearly" && plan.id !== "free"
              ? `R$ ${(parseFloat(plan.price.replace(/[^\d,]/g, "").replace(",", ".")) * 0.8 * 12).toFixed(0).replace(".", ",")}`
              : plan.price;
            const displayPeriod = billingCycle === "yearly" && plan.id !== "free" ? "/ano" : plan.period;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-xl border p-5 bg-gradient-to-br transition-all hover:scale-[1.02]",
                  plan.gradient,
                  isActive && "ring-1 ring-primary/30"
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <span className="absolute -top-2 right-4 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    {plan.badge}
                  </span>
                )}

                <Icon className={cn(
                  "w-6 h-6 mb-3",
                  plan.id === "pro" ? "text-primary" : plan.id === "team" ? "text-amber-400" : "text-muted-foreground"
                )} />

                <h5 className="text-base font-bold text-foreground">{plan.name}</h5>
                <div className="mt-1 mb-4">
                  <span className="text-2xl font-bold text-foreground">{displayPrice}</span>
                  <span className="text-xs text-muted-foreground/60 ml-1">{displayPeriod}</span>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground/80">
                      <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={cn(
                    "w-full py-2.5 rounded-lg text-xs font-bold transition-all",
                    isActive
                      ? "bg-white/5 text-muted-foreground border border-white/10 cursor-default"
                      : plan.id === "pro"
                        ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                        : "bg-white/5 text-foreground border border-white/10 hover:bg-white/10"
                  )}
                  disabled={isActive}
                >
                  {isActive ? "Plano atual" : "Assinar"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Billing History */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center gap-2 mb-4">
          <CalendarDays className="w-3.5 h-3.5" />
          Histórico
        </h4>

        <div className="bg-card/20 border border-white/5 rounded-xl p-5">
          <p className="text-sm text-muted-foreground/60 text-center py-4">
            Nenhuma cobrança registrada
          </p>
        </div>
      </section>
    </div>
  );
}
