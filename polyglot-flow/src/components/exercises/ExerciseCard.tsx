import { ArrowRight, Brain, Mic, Keyboard, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExerciseData {
  title?: string;
  description?: string;
  level?: string;
  duration?: string;
  image?: string;
  [key: string]: any;
}

export interface Exercise {
  tipo: "Clarity" | "Echo" | "Nexus" | "Voice";
  origem: "global" | "personalizado";
  data: ExerciseData;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
}

const getIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "clarity":
      return Zap;
    case "echo":
      return Keyboard;
    case "nexus":
      return Brain;
    case "voice":
      return Mic;
    default:
      return Brain;
  }
};

const getGradient = (type: string) => {
  switch (type.toLowerCase()) {
    case "clarity":
      return "from-amber-500/20 to-orange-600/20 hover:from-amber-500/30 hover:to-orange-600/30 border-amber-500/20";
    case "echo":
      return "from-blue-500/20 to-cyan-600/20 hover:from-blue-500/30 hover:to-cyan-600/30 border-blue-500/20";
    case "nexus":
      return "from-purple-500/20 to-pink-600/20 hover:from-purple-500/30 hover:to-pink-600/30 border-purple-500/20";
    case "voice":
      return "from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 border-emerald-500/20";
    default:
      return "from-gray-500/20 to-slate-600/20 border-gray-500/20";
  }
};

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const Icon = getIcon(exercise.tipo);
  const gradientClass = getGradient(exercise.tipo);

  // Default descriptions based on type if not provided
  const getTitle = () => {
    if (exercise.data.title) return exercise.data.title;
    switch (exercise.tipo.toLowerCase()) {
      case "clarity": return "Clarity Master";
      case "echo": return "Echo Write";
      case "nexus": return "Nexus Connect";
      case "voice": return "Voice Improvement";
      default: return exercise.tipo;
    }
  };

  const getDescription = () => {
    if (exercise.data.description) return exercise.data.description;
    switch (exercise.tipo.toLowerCase()) {
      case "clarity": return "Melhore sua clareza mental e gramatical.";
      case "echo": return "Pratique sua escrita repetindo padrões.";
      case "nexus": return "Conecte ideias e expanda seu vocabulário.";
      case "voice": return "Aperfeiçoe sua pronúncia e entonação.";
      default: return "Exercício prático.";
    }
  };

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-background/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer flex flex-col h-full",
        gradientClass.split(' ').pop() // Use border color
      )}
      onClick={onClick}
    >
      {/* "Photo" Area - using a gradient/icon placeholder */}
      <div className={cn(
        "aspect-square w-full relative flex items-center justify-center bg-gradient-to-br transition-all duration-500",
        gradientClass
      )}>
        <Icon className="w-16 h-16 text-foreground/80 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
        
        {/* Origin Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider bg-background/80 backdrop-blur border border-border/50 text-muted-foreground">
          {exercise.origem}
        </div>
      </div>

      {/* Description Area */}
      <div className="p-5 flex flex-col flex-1 border-t border-border/10">
        <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
          {getTitle()}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {getDescription()}
        </p>
        
        <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          Iniciar Exercício <ArrowRight className="w-3 h-3 ml-1" />
        </div>
      </div>
    </div>
  );
}
