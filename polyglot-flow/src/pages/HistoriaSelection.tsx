import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Clock, HelpCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exerciseService } from "@/services/exerciseService";
import type { ExerciseItem } from "@/types/api";

const HistoriaSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catalogoId = searchParams.get("catalogo");
  const [stories, setStories] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, [catalogoId]);

  const loadStories = async () => {
    setLoading(true);
    try {
      if (!catalogoId) return;
      const exercises = await exerciseService.getByCatalogo(parseInt(catalogoId, 10), 20);
      setStories(exercises);
    } catch (error) {
      console.error("Failed to load stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPreview = (texto: string) => {
    if (!texto) return "História sem texto...";
    return texto.length > 140 ? texto.slice(0, 140) + "..." : texto;
  };

  const getWordCount = (texto: string) => texto ? texto.split(/\s+/).length : 0;

  const getQuestionCount = (data: any) => {
    const perguntas = data["perguntas do texto"] ?? data.perguntas_do_texto ?? {};
    return Object.keys(perguntas).length;
  };

  const getReadingTime = (data: any) => {
    const words = getWordCount(data.texto || "");
    const time = data.tempo_leitura || Math.max(30, Math.ceil(words / 4));
    return Math.ceil(time / 60);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-muted-foreground">Carregando histórias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/exercises")}
              className="rounded-full hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold font-mono italic tracking-tighter">
                <span className="text-white">LEITURA</span>
                <span className="text-emerald-400">IMERSA</span>
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Escolha uma história para exercitar
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {stories.length} {stories.length === 1 ? "história" : "histórias"}
          </div>
        </div>
      </div>

      {/* Story Grid */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhuma história disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stories.map((story) => {
              const storyData = story.dados_exercicio || {};
              const wordCount = getWordCount(storyData.texto || "");
              const questionCount = getQuestionCount(storyData);
              const readingMin = getReadingTime(storyData);

              return (
                <button
                  key={story.id}
                  onClick={() => navigate(`/exercises/Leitura Imersa/${story.id}`)}
                  className={cn(
                    "group relative text-left bg-card/30 backdrop-blur-md rounded-2xl border border-white/5",
                    "p-6 transition-all duration-300",
                    "hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
                    "hover:scale-[1.02]"
                  )}
                >
                  {/* Gradient accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="relative z-10 space-y-4">
                    {/* Title / Preview */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1 group-hover:text-emerald-300 transition-colors">
                          História #{story.id}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {getPreview(storyData.texto || "")}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{readingMin} min
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {wordCount} palavras
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        {questionCount} perguntas
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoriaSelection;
