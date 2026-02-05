import { Phrase } from "@/pages/Dashboard";
import { PhraseCard } from "./PhraseCard";

interface PhraseFeedProps {
  phrases: Phrase[];
  onPhraseClick: (phrase: Phrase) => void;
}

export function PhraseFeed({ phrases, onPhraseClick }: PhraseFeedProps) {
  if (phrases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <span className="text-3xl">📚</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma frase encontrada
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Capture frases enquanto navega para vê-las aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {phrases.map((phrase) => (
        <PhraseCard
          key={phrase.id}
          phrase={phrase}
          onClick={() => onPhraseClick(phrase)}
        />
      ))}
    </div>
  );
}
