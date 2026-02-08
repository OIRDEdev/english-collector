import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PhraseFeed } from "@/components/dashboard/PhraseFeed";
import { PhraseDetailSheet } from "@/components/dashboard/PhraseDetailSheet";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, Loader2 } from "lucide-react";
import { getPhrases, type PhraseWithDetails } from "@/services/phrases";
import { getGroups, type Group } from "@/services/groups";

// Tipo adaptado para o componente (inclui detalhes)
export interface Phrase {
  id: number;
  conteudo: string;
  idioma: string;
  grupo: string;
  titulo_pagina: string;
  favicon_url: string;
  created_at: string;
  detalhes: {
    traducao_completa: string;
    explicacao: string;
    fatias_traducoes: Record<string, string>;
  };
}

interface GroupWithCount {
  nome: string;
  cor: string;
  count: number;
}

const Dashboard = () => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [grupos, setGrupos] = useState<GroupWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Carrega dados ao montar
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        const [phrasesResult, groupsData] = await Promise.all([
          getPhrases({ limit: 20 }),
          getGroups()
        ]);

        // Adapta as frases da API para o formato do componente
        const adaptedPhrases: Phrase[] = phrasesResult.data.map((p: PhraseWithDetails) => {
          let faviconUrl = "";
          if (p.url_origem) {
            try {
              const url = new URL(p.url_origem);
              faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}`;
            } catch {
              faviconUrl = "";
            }
          }
          
          return {
            id: p.id,
            conteudo: p.conteudo,
            idioma: p.idioma_origem,
            grupo: "Geral",
            titulo_pagina: p.titulo_pagina || "Página desconhecida",
            favicon_url: faviconUrl,
            created_at: p.capturado_em,
            detalhes: {
              traducao_completa: p.detalhes?.traducao_completa || "",
              explicacao: p.detalhes?.explicacao || "",
              fatias_traducoes: p.detalhes?.fatias_traducoes || {}
            }
          };
        });

        // Adapta os grupos da API
        const adaptedGroups: GroupWithCount[] = groupsData.map((g: Group) => ({
          nome: g.nome_grupo,
          cor: g.cor_etiqueta || "#22d3ee",
          count: 0
        }));

        setPhrases(adaptedPhrases);
        setGrupos(adaptedGroups);
        setNextCursor(phrasesResult.next_cursor);
        setHasMore(phrasesResult.has_more);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handlePhraseClick = (phrase: Phrase) => {
    setSelectedPhrase(phrase);
    setSheetOpen(true);
  };

  const filteredPhrases = activeGroup
    ? phrases.filter((p) => p.grupo === activeGroup)
    : phrases;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-2">Erro ao carregar dados</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          grupos={grupos}
          activeGroup={activeGroup}
          onGroupSelect={setActiveGroup}
          totalPhrases={phrases.length}
        />

        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border/50 flex items-center px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-4 md:hidden">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {activeGroup || "Todas as Frases"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredPhrases.length} frase{filteredPhrases.length !== 1 ? "s" : ""} capturada{filteredPhrases.length !== 1 ? "s" : ""}
              </p>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {filteredPhrases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma frase capturada ainda.</p>
                <p className="text-sm mt-1">Use a extensão para capturar frases!</p>
              </div>
            ) : (
              <PhraseFeed phrases={filteredPhrases} onPhraseClick={handlePhraseClick} />
            )}
          </div>
        </main>

        <PhraseDetailSheet
          phrase={selectedPhrase}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
