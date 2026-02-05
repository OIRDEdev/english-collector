import { Phrase } from "@/pages/Dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface PhraseCardProps {
  phrase: Phrase;
  onClick: () => void;
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

export function PhraseCard({ phrase, onClick }: PhraseCardProps) {
  const badgeClass = idiomaBadgeColors[phrase.idioma] || "bg-muted text-muted-foreground";
  const idiomaLabel = idiomaLabels[phrase.idioma] || phrase.idioma.toUpperCase();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <Card
      className="group cursor-pointer bg-card/50 border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with favicon and source */}
        <div className="flex items-center gap-2 mb-3">
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
          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Main content */}
        <p className="text-foreground font-medium mb-3 line-clamp-2 leading-relaxed">
          "{phrase.conteudo}"
        </p>

        {/* Translation preview */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
          {phrase.detalhes.traducao_completa}
        </p>

        {/* Footer with badge and date */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`text-xs ${badgeClass}`}>
            {idiomaLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(phrase.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
