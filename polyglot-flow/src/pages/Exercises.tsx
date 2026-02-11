import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ExerciseCard, Exercise } from "@/components/exercises/ExerciseCard";
import { Menu, Dumbbell } from "lucide-react";

// Mock data matching the requested structure
const EXERCISES: Exercise[] = [
  { 
    tipo: "Clarity", 
    origem: "global", 
    data: { 
      title: "Clarity Session", 
      description: "Melhore sua precisão gramatical e clareza mental com exercícios focados." 
    } 
  },
  { 
    tipo: "Echo", // Matches "echo" concept but capitalized for type
    origem: "personalizado", 
    data: { 
      title: "Echo Write", 
      description: "Pratique a estrutura das frases repetindo padrões encontrados em seus textos." 
    } 
  },
  { 
    tipo: "Nexus", 
    origem: "global", 
    data: { 
      title: "Nexus Connect", 
      description: "Conecte conceitos diferentes para expandir seu vocabulário contextual." 
    } 
  },
  { 
    tipo: "Voice", 
    origem: "personalizado", 
    data: { 
      title: "Voice Improvement", 
      description: "Aperfeiçoe sua pronúncia e entonação com feedback de IA em tempo real." 
    } 
  }
];

const Exercises = () => {
    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
                <DashboardSidebar 
                    grupos={[]} 
                    activeGroup={null} 
                    onGroupSelect={() => {}} 
                    totalPhrases={0}
                />
                
                <main className="flex-1 flex flex-col animate-in fade-in duration-500">
                     {/* Header */}
                    <header className="h-16 border-b border-border/50 flex items-center px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10 justify-between">
                        <div className="flex items-center">
                            <SidebarTrigger className="mr-4 md:hidden">
                                <Menu className="h-5 w-5" />
                            </SidebarTrigger>
                            <div className="flex items-center gap-3 text-foreground">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Dumbbell className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h1 className="text-xl font-semibold leading-none">Exercícios</h1>
                                  <p className="text-xs text-muted-foreground mt-1">Pratique e evolua suas habilidades</p>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <div className="flex-1 p-6 overflow-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {EXERCISES.map((ex, i) => (
                                <ExerciseCard key={i} exercise={ex} onClick={() => console.log("Clicked", ex.tipo)} />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};

export default Exercises;
