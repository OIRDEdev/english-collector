// ─── HistoriaExercise — Shared Types ────────────────────────────

export interface Question {
  pergunta: string;
  // Open-ended
  resposta?: string;
  // Multiple choice
  opcoes?: string[];
  resposta_correta?: string;
  // Click on text
  trecho_alvo?: string;
}

export interface HistoriaData {
  texto: string;
  tempo_leitura?: number; // seconds — if missing, calculated from word count
  "perguntas do texto"?: Record<string, Question>;
  perguntas_do_texto?: Record<string, Question>;
}

export interface HistoriaExerciseProps {
  data: HistoriaData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export type Phase = "reading" | "questions" | "results";
