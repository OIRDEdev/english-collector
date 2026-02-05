import { Button } from "@/components/ui/button";
import { Download, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass border border-primary/20">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
          <span className="text-sm text-muted-foreground">Extensão gratuita para Chrome</span>
        </div>

        {/* H1 with gradient */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
          <span className="gradient-text">Domine qualquer idioma</span>
          <br />
          <span className="text-foreground">enquanto navega.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Capture frases reais, obtenha explicações de IA e organize seu aprendizado 
          sem sair da página. <span className="text-foreground font-medium">A web é o seu novo livro didático.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            className="h-14 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow transition-all duration-300 hover:scale-105"
          >
            <Download className="w-5 h-5 mr-2" />
            Instalar Extensão
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-14 px-8 text-base font-semibold border-border hover:bg-secondary/50 transition-all duration-300"
          >
            Ver Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Hero Mockup */}
        <div className="mt-16 md:mt-24 relative">
          <div className="relative glass rounded-2xl p-2 glow hover-lift">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            
            {/* Browser mockup */}
            <div className="bg-card rounded-xl overflow-hidden border border-border">
              {/* Browser header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-muted rounded-md px-3 py-1.5 text-sm text-muted-foreground max-w-md mx-auto">
                    reddit.com/r/learnprogramming
                  </div>
                </div>
              </div>

              {/* Content area with extension popup */}
              <div className="relative p-6 md:p-10 min-h-[300px] md:min-h-[400px]">
                {/* Simulated text content */}
                <div className="space-y-4 text-left max-w-2xl">
                  <div className="h-4 bg-muted/30 rounded w-3/4" />
                  <div className="h-4 bg-muted/30 rounded w-full" />
                  
                  {/* Highlighted text */}
                  <div className="relative inline-block">
                    <p className="text-lg md:text-xl font-medium text-foreground bg-primary/20 px-2 py-1 rounded border-l-2 border-primary">
                      "I don't wanna go home yet, let's keep coding!"
                    </p>
                    
                    {/* Cursor indicator */}
                    <div className="absolute -right-2 -top-2 w-6 h-6 border-2 border-primary rounded-full animate-pulse" />
                  </div>
                  
                  <div className="h-4 bg-muted/30 rounded w-5/6" />
                  <div className="h-4 bg-muted/30 rounded w-2/3" />
                </div>

                {/* Extension popup */}
                <div className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-72 md:w-80 glass rounded-xl p-4 border border-primary/30 glow animate-float">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">P</span>
                    </div>
                    <span className="font-semibold text-sm">PolyGlotFlow</span>
                    <span className="ml-auto text-xs text-muted-foreground">EN → PT</span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Tradução</p>
                      <p className="text-foreground font-medium">Eu não quero ir para casa ainda</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-md">wanna → quero</span>
                      <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded-md">yet → ainda</span>
                    </div>

                    <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Salvar Frase
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
