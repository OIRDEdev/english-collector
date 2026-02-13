import { useState, useEffect, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Menu, Dumbbell, Loader2, ChevronLeft, ChevronRight, Brain, Zap, BookOpen, Keyboard, Bug, Search, Mic, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exerciseService } from "@/services/exerciseService";
import { cn } from "@/lib/utils";
import type { TipoComCatalogo, CatalogoItem } from "@/types/api";

// ─── Icon/Gradient maps by catalogo nome (lowercase) ──────────

const CATALOG_ICONS: Record<string, any> = {
  "clarity master": Zap,
  "echo write": Keyboard,
  "nexus connect": Brain,
  "logic breaker": Bug,
  "key burst": Search,
  "leitura imersa": BookOpen,
  "voice improvement": Mic,
};

const CATALOG_GRADIENTS: Record<string, string> = {
  "clarity master": "from-amber-500/20 to-orange-600/20 hover:from-amber-500/30 hover:to-orange-600/30 border-amber-500/30",
  "echo write": "from-blue-500/20 to-cyan-600/20 hover:from-blue-500/30 hover:to-cyan-600/30 border-blue-500/30",
  "nexus connect": "from-purple-500/20 to-pink-600/20 hover:from-purple-500/30 hover:to-pink-600/30 border-purple-500/30",
  "logic breaker": "from-rose-500/20 to-red-600/20 hover:from-rose-500/30 hover:to-red-600/30 border-rose-500/30",
  "key burst": "from-teal-500/20 to-sky-600/20 hover:from-teal-500/30 hover:to-sky-600/30 border-teal-500/30",
  "leitura imersa": "from-emerald-500/20 to-green-600/20 hover:from-emerald-500/30 hover:to-green-600/30 border-emerald-500/30",
  "voice improvement": "from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 border-emerald-500/30",
};

const TYPE_ICONS: Record<string, any> = {
  "memória": Brain,
  "lógica": Bug,
  "linguagem": BookOpen,
  "vocabulário": Sparkles,
};

const TYPE_GRADIENTS: Record<string, string> = {
  "memória": "from-violet-500/10 to-purple-600/10 border-violet-500/20",
  "lógica": "from-rose-500/10 to-red-600/10 border-rose-500/20",
  "linguagem": "from-emerald-500/10 to-green-600/10 border-emerald-500/20",
  "vocabulário": "from-amber-500/10 to-orange-600/10 border-amber-500/20",
};

const getIcon = (name: string, fallback = Brain) => {
  return CATALOG_ICONS[name.toLowerCase()] || TYPE_ICONS[name.toLowerCase()] || fallback;
};

const getGradient = (name: string) => {
  return CATALOG_GRADIENTS[name.toLowerCase()] || "from-gray-500/20 to-slate-600/20 border-gray-500/20";
};

const getTypeGradient = (name: string) => {
  return TYPE_GRADIENTS[name.toLowerCase()] || "from-gray-500/10 to-slate-600/10 border-gray-500/20";
};

// ─── Carousel Component ────────────────────────────────────────

function CatalogoCarousel({ catalogos, onStartExercise }: {
  catalogos: CatalogoItem[];
  onStartExercise: (catalogo: CatalogoItem) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [catalogos]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 320;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative group/carousel">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 border border-white/10 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white/10 transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {catalogos.map((cat) => {
          const Icon = getIcon(cat.nome);
          const gradient = getGradient(cat.nome);

          return (
            <div
              key={cat.id}
              className={cn(
                "flex-shrink-0 w-[280px] snap-start",
                "group/card relative rounded-2xl border bg-gradient-to-br transition-all duration-300",
                "hover:scale-[1.03] hover:shadow-xl cursor-pointer overflow-hidden",
                gradient
              )}
              onClick={() => onStartExercise(cat)}
            >
              {/* Icon header */}
              <div className="relative h-36 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                <Icon className="w-12 h-12 text-foreground/60 transition-transform duration-500 group-hover/card:scale-110 group-hover/card:rotate-3 relative z-10" />

                {/* Type badge */}
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background/70 backdrop-blur border border-white/10 text-muted-foreground">
                  {cat.tipo_nome}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 pt-3 space-y-2 border-t border-white/5">
                <h3 className="font-bold text-base text-foreground group-hover/card:text-primary transition-colors leading-tight">
                  {cat.nome}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {cat.descricao || "Exercício prático."}
                </p>

                {/* CTA */}
                <div className="pt-2">
                  <button className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-foreground text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    Iniciar
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 border border-white/10 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white/10 transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

const Exercises = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TipoComCatalogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const result = await exerciseService.listCatalog();
      setData(result);
    } catch (error) {
      console.error("Failed to load exercises:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercise = async (catalogo: CatalogoItem) => {
    try {
      // Fetch exercises for this catalog and navigate to the first one
      const exercises = await exerciseService.getByCatalogo(catalogo.id, 3);
      console.log(exercises);
      if (exercises.length > 0) {
        // Pass all exercises via state so ExerciseSession doesn't need another API call
        navigate(`/exercises/${encodeURIComponent(catalogo.nome)}/${exercises[0].id}`, {
          state: { exercises, catalogName: catalogo.nome },
        });
      }
    } catch (error) {
      console.error("Failed to start exercise:", error);
    }
  };

  const totalCatalogos = data.reduce((acc, t) => acc + t.catalogos.length, 0);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          grupos={[]}
          activeGroup={null}
          onGroupSelect={() => navigate("/dashboard")}
          totalPhrases={0}
        />

        <main className="flex-1 flex flex-col animate-in fade-in duration-500">
          {/* Header */}
          <header className="h-16 border-b border-border/50 flex items-center px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10 justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4 md:hidden">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <div className="flex items-center gap-3 text-foreground">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold leading-none">Exercícios</h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalCatalogos} exercícios em {data.length} {data.length === 1 ? "categoria" : "categorias"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {loading ? (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Carregando exercícios...</p>
                </div>
              </div>
            ) : data.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-2">
                  <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground">Nenhum exercício disponível no momento.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-10 max-w-6xl mx-auto">
                {data.map((grupo) => {
                  const TypeIcon = getIcon(grupo.tipo.nome);
                  const typeGrad = getTypeGradient(grupo.tipo.nome);

                  return (
                    <section key={grupo.tipo.id} className="space-y-5">
                      {/* Type Header */}
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br border",
                          typeGrad
                        )}>
                          <TypeIcon className="w-6 h-6 text-foreground/80" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-foreground">
                              {grupo.tipo.nome}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/[0.06] border border-white/10 text-muted-foreground tabular-nums">
                              {grupo.catalogos.length}
                            </span>
                          </div>
                          {grupo.tipo.descricao && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {grupo.tipo.descricao}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Carousel */}
                      {grupo.catalogos.length > 0 ? (
                        <CatalogoCarousel
                          catalogos={grupo.catalogos}
                          onStartExercise={handleStartExercise}
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground/50 pl-16">
                          Nenhum exercício nesta categoria.
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Exercises;
