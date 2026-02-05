import { Shield, BarChart3, Globe, BookOpen } from "lucide-react";

export function BentoGridSection() {
  return (
    <section className="py-24 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Tudo que você <span className="gradient-text">precisa</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas poderosas para acelerar seu aprendizado
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[180px]">
          {/* Dashboard Preview - Large block */}
          <div className="md:col-span-4 lg:col-span-4 md:row-span-2 glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Dashboard Completo</h3>
                  <p className="text-sm text-muted-foreground">Visualize seu progresso</p>
                </div>
              </div>

              {/* Dashboard mockup */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Frases</p>
                    <p className="text-2xl font-bold text-primary">247</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Grupos</p>
                    <p className="text-2xl font-bold">5</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Streak</p>
                    <p className="text-2xl font-bold text-primary">12d</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {["Inglês - Gírias", "Go - Termos Técnicos", "Russo - Básico"].map((group, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm flex-1">{group}</span>
                      <span className="text-xs text-muted-foreground">{[47, 89, 23][i]} frases</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Multi-language block */}
          <div className="md:col-span-2 glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold mb-1">Multi-idioma</h3>
              <p className="text-xs text-muted-foreground mb-3">Suporte a 50+ idiomas</p>
              
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {["🇺🇸", "🇧🇷", "🇯🇵", "🇷🇺", "🇫🇷", "🇩🇪", "🇪🇸", "🇮🇹"].map((flag, i) => (
                  <span 
                    key={i} 
                    className="w-8 h-8 flex items-center justify-center text-lg bg-secondary/50 rounded-lg"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy block */}
          <div className="md:col-span-2 glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold mb-1">Privacidade</h3>
              <p className="text-xs text-muted-foreground mb-3">Bloqueie sites sensíveis</p>
              
              <div className="mt-auto space-y-1.5">
                {["bank.com", "email.google.com"].map((site, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-secondary/50 rounded text-xs">
                    <div className="w-4 h-4 rounded bg-destructive/20 flex items-center justify-center">
                      <span className="text-destructive text-[10px]">✕</span>
                    </div>
                    <span className="text-muted-foreground">{site}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phrases counter - small block */}
          <div className="md:col-span-2 lg:col-span-3 glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold mb-1">Flashcards Inteligentes</h3>
              <p className="text-xs text-muted-foreground">Revise com repetição espaçada</p>
              
              <div className="mt-auto flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">75% dominado</p>
                </div>
                <span className="text-3xl font-bold text-primary">247</span>
              </div>
            </div>
          </div>

          {/* Stats block */}
          <div className="md:col-span-2 lg:col-span-3 glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Usuários ativos</p>
                <p className="text-4xl font-bold">10k<span className="text-primary">+</span></p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">+ outros aprendizes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
