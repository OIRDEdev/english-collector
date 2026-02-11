import { useState } from "react";
import { Brain, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface NexusOption {
  texto: string;
  correta: boolean;
}

interface NexusData {
  id: number;
  instrucao: string;
  palavra_central: string;
  opcoes: NexusOption[];
  tema: string;
}

interface NexusExerciseProps {
  data: NexusData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function NexusExercise({ data, onComplete }: NexusExerciseProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (option: NexusOption) => {
    if (isFinished) return;
    
    setSelectedOption(option.texto);
    setIsFinished(true);

    const points = option.correta ? 100 : 0;
    setScore(points);

    // Simulated network delay or animation
    setTimeout(() => onComplete(points), 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-4xl mx-auto p-6 space-y-12">
      
      {/* Header */}
      <div className="w-full flex justify-between items-start">
        <div className="flex flex-col">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent italic tracking-tight">
                NEXUSCONNECT
            </h2>
            <div className="flex items-center gap-2 mt-1 opacity-70">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs uppercase font-mono tracking-widest text-purple-300">
                    {data.instrucao} • {data.tema}
                </span>
            </div>
        </div>
        
        <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                VOCAB EXPANDER
            </span>
            <div className="flex items-center gap-1 text-cyan-400 font-mono text-lg">
                XP: <span className="font-bold text-white">0</span>
            </div>
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="relative w-full flex justify-center items-center py-12 md:py-20 min-h-[400px]">
        
        {/* Connection Lines (Simulated SVG) */}
        <div className="absolute inset-0 pointer-events-none flex justify-center items-center opacity-20">
             <svg className="w-full h-full max-w-2xl">
                <line x1="20%" y1="50%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-purple-500 animate-pulse" />
                <line x1="80%" y1="50%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-purple-500 animate-pulse" />
             </svg>
        </div>

        {/* Central Node */}
        <div className="relative z-20 w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_60px_-10px_rgba(34,211,238,0.4)] flex items-center justify-center transform transition-transform hover:scale-105 duration-500 group animate-float">
             <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping opacity-20" />
             <div className="text-center z-10 p-4">
                <h3 className="text-2xl md:text-4xl font-black text-white drop-shadow-lg tracking-tight">
                    {data.palavra_central}
                </h3>
                <Star className="w-4 h-4 text-yellow-300 mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
             </div>
        </div>

        {/* Option A (Left) */}
        <div className="absolute left-0 md:left-10 top-1/2 -translate-y-1/2 z-10 w-40 h-40 md:w-56 md:h-56">
             <button
                onClick={() => handleSelect(data.opcoes[0])}
                disabled={isFinished}
                className={cn(
                    "w-full h-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-card/30 backdrop-blur-sm",
                    selectedOption === data.opcoes[0].texto 
                        ? (data.opcoes[0].correta ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10")
                        : "border-white/10 text-muted-foreground hover:border-purple-500/50 hover:text-white"
                )}
             >
                <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Opção A</span>
                <span className="text-xl md:text-2xl font-bold">{data.opcoes[0].texto}</span>
             </button>
        </div>

        {/* Option B (Right) */}
        <div className="absolute right-0 md:right-10 top-1/2 -translate-y-1/2 z-10 w-40 h-40 md:w-56 md:h-56">
             <button
                onClick={() => handleSelect(data.opcoes[1])}
                disabled={isFinished}
                className={cn(
                    "w-full h-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-card/30 backdrop-blur-sm",
                    selectedOption === data.opcoes[1].texto 
                        ? (data.opcoes[1].correta ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10")
                        : "border-white/10 text-muted-foreground hover:border-purple-500/50 hover:text-white"
                )}
             >
                <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Opção B</span>
                <span className="text-xl md:text-2xl font-bold">{data.opcoes[1].texto}</span>
             </button>
        </div>

      </div>

      {/* Result feedback */}
      <div className={cn(
         "fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full backdrop-blur-md border transition-all duration-500 transform translate-y-20 opacity-0",
         isFinished && "translate-y-0 opacity-100",
         score > 0 ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400"
      )}>
         <span className="font-bold flex items-center gap-2">
            {score > 0 ? "Correto! +100XP" : "Incorreto! Tente novamente."}
         </span>
      </div>

    </div>
  );
}
