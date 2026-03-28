import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNexusLogic } from "./useNexusLogic";
import CentralNode from "./components/CentralNode";
import OptionNode from "./components/OptionNode";
import ExerciseHeader from "../Shared/ExerciseHeader";
import type { NexusExerciseProps } from "./types";

export function NexusExercise({ data, onComplete }: NexusExerciseProps) {
  const { selectedOption, isFinished, score, handleSelect } = useNexusLogic(onComplete);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-4xl mx-auto p-6 space-y-12">
      {/* Header */}
      <ExerciseHeader
        title="NEXUS"
        accent="CONNECT"
        accentColor="text-purple-400"
        subtitle={
          <span className="flex items-center gap-2 mt-1 opacity-70">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-xs uppercase font-mono tracking-widest text-purple-300">
              {data.instrucao} • {data.tema}
            </span>
          </span> as any
        }
        right={
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              VOCAB EXPANDER
            </span>
            <div className="flex items-center gap-1 text-cyan-400 font-mono text-lg">
              XP: <span className="font-bold text-white">0</span>
            </div>
          </div>
        }
      />

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
        <CentralNode palavraCentral={data.palavra_central} />

        {/* Option A (Left) */}
        <div className="absolute left-0 md:left-10 top-1/2 -translate-y-1/2 z-10 w-24 h-32 md:w-56 md:h-56">
          <OptionNode
            label="Opção A"
            option={data.opcoes[0]}
            selectedOption={selectedOption}
            isFinished={isFinished}
            onSelect={handleSelect}
          />
        </div>

        {/* Option B (Right) */}
        <div className="absolute right-0 md:right-10 top-1/2 -translate-y-1/2 z-10 w-24 h-32 md:w-56 md:h-56">
          <OptionNode
            label="Opção B"
            option={data.opcoes[1]}
            selectedOption={selectedOption}
            isFinished={isFinished}
            onSelect={handleSelect}
          />
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
