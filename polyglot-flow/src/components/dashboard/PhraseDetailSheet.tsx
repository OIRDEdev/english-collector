import { Phrase } from "@/pages/Dashboard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Sparkles, Layers } from "lucide-react";
import { useState } from "react";

interface PhraseDetailSheetProps {
  phrase: Phrase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const idiomaBadgeColors: Record<string, string> = {
  en: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  go: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ru: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  pt: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const idiomaLabels: Record<string, string> = {
  en: "English",
  go: "Go Lang",
  ru: "Русский",
  pt: "Português",
};

export function PhraseDetailSheet({
  phrase,
  open,
  onOpenChange,
}: PhraseDetailSheetProps) {
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  if (!phrase) return null;

  const badgeClass = idiomaBadgeColors[phrase.idioma] || "bg-muted text-muted-foreground";
  const idiomaLabel = idiomaLabels[phrase.idioma] || phrase.idioma.toUpperCase();
  const slices = Object.entries(phrase.detalhes.fatias_traducoes);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-background border-l border-border/50 overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={phrase.favicon_url}
              alt=""
              className="w-4 h-4 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <span className="text-xs text-muted-foreground truncate flex-1">
              {phrase.titulo_pagina}
            </span>
            <Badge variant="outline" className={`text-xs ${badgeClass}`}>
              {idiomaLabel}
            </Badge>
          </div>
          <SheetTitle className="text-left text-xl font-semibold text-foreground">
            Detalhes da Frase
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Original Phrase */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Original
            </h3>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-lg font-medium text-foreground leading-relaxed">
                "{phrase.conteudo}"
              </p>
            </div>
          </section>

          {/* Full Translation */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Tradução Completa
            </h3>
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-foreground leading-relaxed">
                {phrase.detalhes.traducao_completa}
              </p>
            </div>
          </section>

          <Separator className="bg-border/50" />

          {/* Slices */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Fatias de Tradução
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {slices.map(([original, translation]) => (
                <button
                  key={original}
                  onClick={() => setActiveSlice(activeSlice === original ? null : original)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                    activeSlice === original
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-foreground border-border/50 hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  {original}
                </button>
              ))}
            </div>

            {activeSlice && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-xs text-muted-foreground mb-1">Tradução:</p>
                <p className="text-lg font-medium text-primary">
                  {phrase.detalhes.fatias_traducoes[activeSlice]}
                </p>
              </div>
            )}

            {!activeSlice && (
              <p className="text-sm text-muted-foreground italic">
                Clique em uma fatia para ver sua tradução
              </p>
            )}
          </section>

          <Separator className="bg-border/50" />

          {/* AI Explanation */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Explicação da IA
            </h3>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <p className="text-foreground leading-relaxed text-sm">
                {phrase.detalhes.explicacao}
              </p>
            </div>
          </section>

          {/* Metadata */}
          <section className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Grupo: {phrase.grupo}</span>
              <span>
                {new Date(phrase.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
