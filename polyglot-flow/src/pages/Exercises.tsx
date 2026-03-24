import { useState, useEffect, useMemo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Menu, Dumbbell, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exerciseService } from "@/services/exerciseService";
import { cn } from "@/lib/utils";
import type { TipoComCatalogo, CatalogoItem } from "@/types/api";
import { toast } from "sonner";
import { CardAnimation, getCardAnimation } from "@/components/exercises/componets/CardAnimationMap";

// ─── Gradient / Tag maps by catalogo nome (lowercase) ──────────

const CATALOG_GRADIENTS: Record<string, string> = {
  "clarity master": "from-amber-500/20 to-orange-600/20 hover:from-amber-500/30 hover:to-orange-600/30 border-amber-500/30",
  "echo write": "from-blue-500/20 to-cyan-600/20 hover:from-blue-500/30 hover:to-cyan-600/30 border-blue-500/30",
  "nexus connect": "from-purple-500/20 to-pink-600/20 hover:from-purple-500/30 hover:to-pink-600/30 border-purple-500/30",
  "logic breaker": "from-rose-500/20 to-red-600/20 hover:from-rose-500/30 hover:to-red-600/30 border-rose-500/30",
  "key burst": "from-teal-500/20 to-sky-600/20 hover:from-teal-500/30 hover:to-sky-600/30 border-teal-500/30",
  "leitura imersa": "from-emerald-500/20 to-green-600/20 hover:from-emerald-500/30 hover:to-green-600/30 border-emerald-500/30",
  "voice improvement": "from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 border-emerald-500/30",
  "chainofsentence": "from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border-cyan-500/30",
  "wordmemory": "from-fuchsia-500/20 to-pink-600/20 hover:from-fuchsia-500/30 hover:to-pink-600/30 border-fuchsia-500/30",
  "connection": "from-lime-500/20 to-green-600/20 hover:from-lime-500/30 hover:to-green-600/30 border-lime-500/30",
};

const TAG_COLORS: Record<string, string> = {
  "memória": "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "lógica": "bg-rose-500/15 text-rose-400 border-rose-500/20",
  "linguagem": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "vocabulário": "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

const getGradient = (name: string) => {
  return CATALOG_GRADIENTS[name.toLowerCase()] || "from-gray-500/20 to-slate-600/20 border-gray-500/20";
};

const getTagColor = (tipoNome: string) => {
  return TAG_COLORS[tipoNome.toLowerCase()] || "bg-white/10 text-muted-foreground border-white/10";
};

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

  // Flatten all catalogos into a single array
  const allCatalogos = useMemo(() => {
    return data.flatMap((grupo) => grupo.catalogos);
  }, [data]);

  const handleStartExercise = async (catalogo: CatalogoItem) => {
    try {
      const exercises = await exerciseService.getByCatalogo(catalogo.id, 3);
      if(exercises.length === 0){
        toast.error("Nenhum exercício disponível no momento.");
        return;
      }
      if (exercises.length > 0) {
        navigate(`/exercises/${encodeURIComponent(catalogo.nome)}/${exercises[0].id}`, {
          state: { exercises, catalogName: catalogo.nome },
        });
      }
    } catch (error) {
      console.error("Failed to start exercise:", error);
    }
  };

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
                    {allCatalogos.length} exercícios disponíveis
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
            ) : allCatalogos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-2">
                  <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground">Nenhum exercício disponível no momento.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
                {allCatalogos.map((cat) => {
                  const gradient = getGradient(cat.nome);
                  const tagColor = getTagColor(cat.tipo_nome);
                  const hasAnimation = !!getCardAnimation(cat.nome);

                  return (
                    <div
                      key={cat.id}
                      className={cn(
                        "group/card relative rounded-2xl border transition-all duration-300",
                        "hover:scale-[1.03] hover:shadow-2xl cursor-pointer overflow-hidden",
                        `bg-gradient-to-br ${gradient}`
                      )}
                      style={{ minHeight: "280px" }}
                      onClick={() => handleStartExercise(cat)}
                    >
                      {/* Animated background */}
                      {hasAnimation && <CardAnimation catalogName={cat.nome} />}

                      {/* Title always visible at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-5 transition-opacity duration-300 group-hover/card:opacity-0">
                        <h3 className="font-bold text-lg leading-tight drop-shadow-lg text-foreground">
                          {cat.nome}
                        </h3>
                      </div>

                      {/* Hover overlay — transparent info floating */}
                      <div className={cn(
                        "absolute inset-0 z-20 flex flex-col justify-end p-5 transition-all duration-300",
                        "opacity-0 group-hover/card:opacity-100",
                        "bg-background/40 backdrop-blur-[6px]"
                      )}>
                        {/* Tag */}
                        <span className={cn(
                          "inline-block self-start px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-2",
                          tagColor
                        )}>
                          {cat.tipo_nome}
                        </span>

                        {/* Title */}
                        <h3 className="font-bold text-lg leading-tight mb-1 drop-shadow-md text-foreground">
                          {cat.nome}
                        </h3>

                        {/* Description */}
                        <p className="text-xs leading-relaxed mb-3 line-clamp-3 text-muted-foreground">
                          {cat.descricao || "Exercício prático."}
                        </p>

                        {/* CTA */}
                        <button className="w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border bg-white/[0.06] border-white/10 text-foreground hover:bg-white/10">
                          Iniciar
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
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
