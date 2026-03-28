export interface EchoData {
  id: number;
  frase_id: number;
  instrucao: string;
  texto_total: string;
  parte_oculta: string;
  texto_lacunado: string;
  audio_url: string;
  fase_inicial: number;
}

export interface EchoExerciseProps {
  data: EchoData;
  onComplete: (score: number) => void;
  onExit: () => void;
}
