import { Sparkles, MessageSquare } from "lucide-react";

export function AIExplainerSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute right-0 top-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full glass border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by AI</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            A IA que <span className="gradient-text">Explica de Verdade</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Não apenas traduz — entenda gírias, expressões idiomáticas e contexto cultural
          </p>
        </div>

        {/* Main content - side by side */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left - Original phrase */}
          <div className="order-2 lg:order-1">
            <div className="glass rounded-2xl p-6 md:p-8 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frase Original</p>
                  <p className="text-xs text-muted-foreground/60">reddit.com</p>
                </div>
              </div>

              <blockquote className="text-2xl md:text-3xl font-bold leading-relaxed mb-6">
                "I don't <span className="text-primary">wanna</span> go home yet, let's keep <span className="text-primary">grinding</span>!"
              </blockquote>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-primary/20 text-primary text-sm rounded-full font-medium">
                  🇺🇸 Inglês Informal
                </span>
                <span className="px-3 py-1.5 bg-secondary text-muted-foreground text-sm rounded-full">
                  Contexto: Programação
                </span>
              </div>
            </div>
          </div>

          {/* Right - AI Explanation */}
          <div className="order-1 lg:order-2">
            <div className="glass rounded-2xl p-6 md:p-8 border border-primary/30 glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Explicação da IA</p>
                  <p className="text-xs text-muted-foreground">Análise Contextual</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Wanna explanation */}
                <div className="p-4 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded">
                      GÍRIA
                    </span>
                    <span className="font-semibold">wanna</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Contração informal de <span className="text-foreground font-medium">"want to"</span>. 
                    Muito comum na fala cotidiana americana. Em contextos formais, 
                    prefira a forma completa.
                  </p>
                </div>

                {/* Grinding explanation */}
                <div className="p-4 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs font-bold rounded">
                      TERMO TECH
                    </span>
                    <span className="font-semibold">grinding</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No contexto de programação, significa <span className="text-foreground font-medium">"trabalhar intensamente"</span> ou 
                    "estudar com dedicação". Originado da cultura gamer, 
                    agora amplamente usado em tech.
                  </p>
                </div>

                {/* Translation */}
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Tradução Natural</p>
                  <p className="text-foreground font-medium">
                    "Não quero ir pra casa ainda, vamos continuar estudando firme!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
