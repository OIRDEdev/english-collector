export interface KeyBurstData {
  id?: number;
  instrucao: string;
  descricao: string;
  resposta: string;
  distratores: string;
  tags?: string[];
}

export interface KeyBurstExerciseProps {
  data: KeyBurstData;
  onComplete: (score: number) => void;
  onExit: () => void;
}
