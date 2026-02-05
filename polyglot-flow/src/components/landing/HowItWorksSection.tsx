import { MousePointer2, Layers, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: MousePointer2,
    title: "Capture",
    description: "Selecione qualquer frase em qualquer site. Nossa extensão detecta automaticamente o idioma.",
    visual: (
      <div className="relative h-48 flex items-center justify-center">
        <div className="relative w-full max-w-xs p-4 glass rounded-lg">
          <div className="space-y-2">
            <div className="h-3 bg-muted/40 rounded w-full" />
            <div className="h-3 bg-muted/40 rounded w-4/5" />
            <div className="relative inline-block">
              <span className="bg-primary/30 text-foreground px-1 text-sm rounded">
                selected text here
              </span>
              <MousePointer2 className="absolute -bottom-4 -right-4 w-5 h-5 text-primary animate-pulse" />
            </div>
            <div className="h-3 bg-muted/40 rounded w-3/4" />
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Layers,
    title: "Entenda",
    description: "Veja a tradução dividida em 'fatias' inteligentes. Entenda cada parte da frase.",
    visual: (
      <div className="relative h-48 flex items-center justify-center">
        <div className="space-y-2">
          {[
            { en: "I don't", pt: "Eu não" },
            { en: "wanna", pt: "quero" },
            { en: "go home", pt: "ir para casa" },
          ].map((slice, i) => (
            <div
              key={i}
              className="flex items-center gap-3 glass rounded-lg p-3 hover-lift cursor-pointer"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-muted-foreground text-sm font-medium w-20">{slice.en}</span>
              <span className="text-primary">→</span>
              <span className="text-foreground font-medium">{slice.pt}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: TrendingUp,
    title: "Evolua",
    description: "Organize suas frases por idioma e acompanhe seu progresso no dashboard.",
    visual: (
      <div className="relative h-48 flex items-center justify-center">
        <div className="w-full max-w-xs glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progresso Semanal</span>
            <span className="text-primary text-sm font-bold">+127%</span>
          </div>
          <div className="flex items-end gap-1 h-16">
            {[40, 55, 35, 70, 85, 60, 95].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/30 rounded-t transition-all duration-300 hover:bg-primary/50"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">🇺🇸 EN</span>
            <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded-full">🇷🇺 RU</span>
            <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded-full">🇯🇵 JP</span>
          </div>
        </div>
      </div>
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 relative">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Como <span className="gradient-text">Funciona</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Três passos simples para transformar sua navegação em aprendizado
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Step number */}
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg z-10">
                {index + 1}
              </div>

              <div className="glass rounded-2xl p-6 h-full transition-all duration-300 group-hover:border-primary/30 border border-transparent">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  {step.description}
                </p>

                {/* Visual */}
                {step.visual}
              </div>

              {/* Connector line (hidden on mobile and last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-px bg-gradient-to-r from-border to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
