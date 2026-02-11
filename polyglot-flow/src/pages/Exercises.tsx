import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ExerciseCard, Exercise } from "@/components/exercises/ExerciseCard";
import { Menu, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data matching the requested structure
const EXERCISES = [
  {
    "tipo": "Clarity",
    "origem": "global",
    "data": [
      {
        "id": 101,
        "instrucao": "Remova o ruído da frase",
        "texto_completo": "The blue water bottle is although very cold today.",
        "palavras_erradas": ["although"],
        "tempo_limite": 15,
        "dificuldade": "iniciante"
      },
      {
        "id": 102,
        "frase_id": 10,
        "instrucao": "Identifique a redundância na sua captura",
        "texto_completo": "I am currently now working on the Go project.",
        "palavras_erradas": ["now"],
        "tempo_limite": 12,
        "contexto": "Programação Go"
      }
    ]
  },
  {
    "tipo": "Echo",
    "origem": "personalizado",
    "data": [
      {
        "id": 502,
        "frase_id": 1,
        "instrucao": "Ouça e digite a frase capturada",
        "texto_total": "I don't wanna go home yet",
        "parte_oculta": "wanna go home",
        "texto_lacunado": "I don't ___________ yet",
        "audio_url": "https://api.seusistema.com/audio/frase_1.mp3",
        "fase_inicial": 1
      }
    ]
  },
  {
    "tipo": "Nexus", // Using Nexus as type, mapped to NexusConnect
    "origem": "global",
    "data": [
      {
        "id": 205,
        "instrucao": "Arraste para o sinônimo correto",
        "palavra_central": "Rapid",
        "opcoes": [
          { "texto": "Quick", "correta": true },
          { "texto": "Slow", "correta": false }
        ],
        "tema": "vocabulario_geral"
      }
    ]
  }
];

const Exercises = () => {
    const navigate = useNavigate();

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
                <DashboardSidebar 
                    grupos={[]} 
                    activeGroup={null} 
                    onGroupSelect={() => navigate('/dashboard')} 
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
                            {EXERCISES.map((group, i) => (
                                <ExerciseCard 
                                    key={i} 
                                    exercise={{
                                        ...group,
                                        data: group.data[0] // Use first item for visual preview
                                    } as any}
                                    onClick={() => navigate(`/exercises/${group.tipo}/${group.data[0].id}`)} 
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};

export default Exercises;
