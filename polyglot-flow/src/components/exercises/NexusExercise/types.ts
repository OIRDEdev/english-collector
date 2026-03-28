export interface NexusOption {
  texto: string;
  correta: boolean;
}

export interface NexusData {
  id: number;
  instrucao: string;
  palavra_central: string;
  opcoes: NexusOption[];
  tema: string;
}

export interface NexusExerciseProps {
  data: NexusData;
  onComplete: (score: number) => void;
  onExit: () => void;
}
