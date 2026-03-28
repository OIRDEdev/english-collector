export interface WordEntry {
  text: string;
  from: "user" | "ai" | "initial";
}

export interface ChainExerciseData {
  instrucao: string;
  palavra_inicial: string;
}

export interface ChainExerciseProps {
  data: ChainExerciseData;
  onComplete: (score: number) => void;
  onExit: () => void;
}
