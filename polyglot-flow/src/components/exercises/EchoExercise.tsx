import { useState, useRef, useEffect } from "react";
import { Mic, ArrowRight, Play, CheckCircle2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EchoData {
  id: number;
  frase_id: number;
  instrucao: string;
  texto_total: string;
  parte_oculta: string;
  texto_lacunado: string;
  audio_url: string;
  fase_inicial: number;
}

interface EchoExerciseProps {
  data: EchoData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function EchoExercise({ data, onComplete }: EchoExerciseProps) {
  const [userInput, setUserInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Focus input on mount
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  const handlePlay = () => {
    // Mock play logic since we don't have real audio files yet
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000); 
  };

  const checkAnswer = () => {
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,!?;:]/g, "");
    const expected = normalize(data.parte_oculta);
    const actual = normalize(userInput);
    
    // Simple exact match logic for now
    // Levenshtein would be better
    let score = 0;
    if (actual === expected) score = 100;
    else if (expected.includes(actual) && actual.length > expected.length / 2) score = 50;

    setIsFinished(true);
    setTimeout(() => onComplete(score), 2000);
  };

  // Split text for visual representation
  const parts = data.texto_lacunado.split("___________");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-3xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="w-full flex justify-between items-end mb-8 relative">
        <div className="flex flex-col z-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                ECHOWRITE
            </h2>
            <div className="flex items-center gap-2 mt-2">
                <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider">
                    Fase {data.fase_inicial}: Transcrição
                </span>
            </div>
        </div>
        
        {/* Progress Dots Mockup */}
        <div className="flex gap-2 opacity-50">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full bg-card/60 backdrop-blur-xl rounded-3xl border border-white/5 p-10 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:shadow-blue-500/10 hover:border-blue-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-8 relative z-10">
            
            {/* Audio Prompt */}
            <Button
                size="icon"
                variant="outline"
                className={cn(
                    "w-16 h-16 rounded-full border-2 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:scale-105 transition-all duration-300",
                    isPlaying && "animate-pulse border-blue-400 bg-blue-400/20"
                )}
                onClick={handlePlay}
            >
                {isPlaying ? <Mic className="w-6 h-6 text-blue-400 animate-bounce" /> : <Play className="w-6 h-6 text-blue-400 ml-1" />}
            </Button>

            {/* Helper Text Display */}
            <div className="text-center space-y-2">
                <p className="text-xl font-medium text-muted-foreground/80">
                    {parts[0]}
                    <span className={cn(
                        "mx-1 px-2 border-b-2 border-dashed transition-all duration-300",
                        userInput ? "border-blue-500 text-foreground" : "border-muted-foreground/30 text-transparent"
                    )}>
                        {userInput || "___________"}
                    </span>
                    {parts[1]}
                </p>
                <p className="text-sm text-muted-foreground/50 italic">
                    {data.instrucao}
                </p>
            </div>

            {/* Input Area */}
            <div className="w-full max-w-md relative group/input">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                <Input
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                    placeholder="Comece a digitar..."
                    disabled={isFinished}
                    className="h-14 bg-background/50 border-white/10 text-center text-lg shadow-inner focus:ring-blue-500/50 focus:border-blue-500/50 transition-all rounded-xl relative z-10"
                />
            </div>

        </div>

        {/* Feedback Area */}
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
