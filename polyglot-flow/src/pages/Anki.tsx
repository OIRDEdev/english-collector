import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Menu, Eye, Play, RotateCcw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ankiService } from "@/services/ankiService";
import type { AnkiCard, AnkiStats } from "@/types/api";

export default function Anki() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [stats, setStats] = useState<AnkiStats | null>(null);

  // TODO: pegar user_id do contexto de auth quando implementado
  const userId = 1;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dueCards, sessionStats] = await Promise.all([
        ankiService.getDueCards(userId),
        ankiService.getStats(userId),
      ]);
      setCards(dueCards);
      setStats(sessionStats);
    } catch (error) {
      console.error("Failed to load anki data:", error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = cards[currentIndex];

  const handleReview = async (nota: number) => {
    if (!currentCard || submitting) return;

    setSubmitting(true);
    try {
      await ankiService.submitReview(userId, {
        anki_id: currentCard.id,
        nota,
      });

      if (currentIndex + 1 >= cards.length) {
        setFinished(true);
      } else {
        setRevealed(false);
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setFinished(false);
    setCurrentIndex(0);
    setRevealed(false);
    loadData();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar 
            grupos={[]} 
            activeGroup={null} 
            onGroupSelect={() => navigate('/dashboard')} 
            totalPhrases={0}
        />
        
        <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
             {/* Header */}
            <header className="h-16 border-b border-border/50 flex items-center px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10 justify-between">
                <div className="flex items-center">
                    <SidebarTrigger className="mr-4 md:hidden">
                        <Menu className="h-5 w-5" />
                    </SidebarTrigger>
                    <h1 className="text-xl font-semibold">Anki Flashcards</h1>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-6">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                        <p className="text-muted-foreground">Carregando flashcards...</p>
                    </div>
                ) : !started && !finished ? (
                    // Start Screen
                    <div className="w-full max-w-md p-8 flex flex-col items-center text-center space-y-8 bg-card/30 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-2 ring-4 ring-white/5">
                            <Play className="w-10 h-10 text-indigo-400 ml-1" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Sessão de Estudo
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                Você tem <span className="font-bold text-foreground">{stats?.due_today ?? cards.length}</span> flashcards para revisar hoje.
                            </p>
                            {stats && (
                                <div className="flex gap-4 justify-center text-sm text-muted-foreground mt-2">
                                    <span>🆕 {stats.novos} novos</span>
                                    <span>📖 {stats.aprendendo} aprendendo</span>
                                    <span>🔄 {stats.revisao} revisão</span>
                                </div>
                            )}
                        </div>
                        <Button 
                            size="lg" 
                            className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]" 
                            onClick={() => setStarted(true)}
                            disabled={cards.length === 0}
                        >
                            {cards.length > 0 ? "Iniciar Agora" : "Nenhum card para revisar"}
                        </Button>
                    </div>
                ) : finished ? (
                    // Finished Screen
                    <div className="w-full max-w-md p-8 flex flex-col items-center text-center space-y-6 bg-card/30 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                            <RotateCcw className="w-10 h-10 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Sessão Concluída!</h2>
                            <p className="text-muted-foreground">Você revisou todos os {cards.length} cards de hoje.</p>
                        </div>
                        <div className="flex w-full gap-3">
                            <Button variant="outline" className="flex-1" onClick={handleRestart}>
                                Reiniciar
                            </Button>
                            <Button className="flex-1" onClick={() => navigate('/dashboard')}>
                                Voltar ao Dashboard
                            </Button>
                        </div>
                    </div>
                ) : currentCard ? (
                    // Card Screen
                    <div className="w-full flex flex-col items-center">
                        <div className="relative w-full max-w-3xl aspect-[16/9] perspective-1000 flex flex-col">
                        <div className={cn(
                            "flex-1 relative w-full h-full bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-12 text-center transition-all duration-500 group overflow-hidden",
                            !revealed ? "hover:border-indigo-500/30" : "border-indigo-500/50 bg-indigo-500/5"
                        )}>
                            
                            {/* Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                            <span className="absolute top-6 left-8 text-sm font-mono tracking-widest text-muted-foreground/50">
                                CARD {currentIndex + 1} / {cards.length}
                            </span>
                            
                            <div className="relative z-10 space-y-8 flex-1 flex flex-col items-center justify-center w-full">
                                <h3 className="text-3xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
                                    {currentCard.conteudo}
                                </h3>

                                {revealed && (
                                    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-500 flex flex-col items-center">
                                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent my-6" />
                                        <p className="text-2xl md:text-3xl text-indigo-400 font-medium">
                                            {currentCard.traducao_completa}
                                        </p>
                                        {currentCard.fatias_traducoes && Object.keys(currentCard.fatias_traducoes).length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                                {Object.entries(currentCard.fatias_traducoes).map(([key, value]) => (
                                                    <span key={key} className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-muted-foreground">
                                                        <span className="text-foreground">{key}</span> → {value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                    
                    {/* Floating Action Button area - Outside Card */}
                    <div className="mt-8 flex justify-center z-20">
                        {!revealed ? (
                            <Button 
                                variant="ghost" 
                                size="lg"
                                className="h-14 px-8 rounded-full bg-background/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                onClick={() => setRevealed(true)}
                            >
                                <Eye className="w-5 h-5 mr-3" />
                                <span className="text-lg font-medium tracking-wide">Revelar Resposta</span>
                            </Button>
                        ) : (
                            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <Button 
                                    size="lg" 
                                    className="h-14 px-8 rounded-full bg-red-500/80 hover:bg-red-600 text-white shadow-lg hover:scale-105 transition-all"
                                    onClick={() => handleReview(2)}
                                    disabled={submitting}
                                >
                                    <span className="text-lg font-medium tracking-wide">
                                        {submitting ? "..." : "Difícil"}
                                    </span>
                                </Button>
                                <Button 
                                    size="lg" 
                                    className="h-14 px-8 rounded-full bg-green-500/80 hover:bg-green-600 text-white shadow-lg hover:scale-105 transition-all"
                                    onClick={() => handleReview(4)}
                                    disabled={submitting}
                                >
                                    <span className="text-lg font-medium tracking-wide">
                                        {submitting ? "..." : "Fácil"}
                                    </span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    </main>
  </div>
</SidebarProvider>
  );
}
