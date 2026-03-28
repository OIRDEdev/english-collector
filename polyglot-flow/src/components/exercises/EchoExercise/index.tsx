import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEchoExercise } from "./useEchoExercise";
import AudioVisualizer from "./components/AudioVisualizer";
import TranscriptionInput from "./components/TranscriptionInput";
import ExerciseHeader from "../Shared/ExerciseHeader";
import type { EchoExerciseProps } from "./types";

export function EchoExercise({ data, onComplete }: EchoExerciseProps) {
  const {
    userInput, setUserInput,
    isPlaying, isFinished,
    inputRef, handlePlay, checkAnswer
  } = useEchoExercise(data, onComplete);

  // Split text around the gap token
  const parts = data.texto_lacunado.split("___________");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-3xl mx-auto p-6 space-y-8">
      {/* Header aligned with Shared component */}
      <div className="w-full flex justify-between items-end mb-8 relative">
        <div className="z-10 w-full">
          <ExerciseHeader 
            title="ECHO" 
            accent="WRITE" 
            accentColor="text-blue-400"
            subtitle={`Fase ${data.fase_inicial}: Transcrição`} 
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full bg-card/60 backdrop-blur-xl rounded-3xl border border-white/5 p-10 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:shadow-blue-500/10 hover:border-blue-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-8 relative z-10">
          <AudioVisualizer isPlaying={isPlaying} onPlay={handlePlay} />
          
          <TranscriptionInput
            parts={parts}
            userInput={userInput}
            onChange={setUserInput}
            onEnter={checkAnswer}
            disabled={isFinished}
            instruction={data.instrucao}
            inputRef={inputRef}
          />
        </div>

        {/* Feedback Overlay */}
        {isFinished && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300 z-20">
            <div className="mb-4 p-4 bg-green-500/20 rounded-full border border-green-500/50">
               <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Transcrição Completa!</h3>
            <p className="text-muted-foreground mb-6">Você completou a frase corretamente.</p>
            <Button onClick={() => onComplete(100)} variant="outline" className="gap-2">
              Próximo Exercício <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
