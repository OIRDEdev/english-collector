import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { Menu, Dumbbell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exerciseService } from "@/services/exerciseService";
import type { ExerciseGroup } from "@/types/api";

const Exercises = () => {
    const navigate = useNavigate();
    const [exercises, setExercises] = useState<ExerciseGroup[]>([]);
    const [loading, setLoading] = useState(true);

    // TODO: pegar user_id do contexto de auth quando implementado
    const userId = 1;

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        setLoading(true);
        try {
            const groups = await exerciseService.listGrouped(userId);
            setExercises(groups);
        } catch (error) {
            console.error("Failed to load exercises:", error);
            setExercises([]);
        } finally {
            setLoading(false);
        }
    };

    // Mapear tipo_componente para o tipo do ExerciseCard
    const mapTipo = (tipo: string): "Clarity" | "Echo" | "Nexus" | "Voice" => {
        switch (tipo.toLowerCase()) {
            case "clarity": return "Clarity";
            case "echo": return "Echo";
            case "nexus": return "Nexus";
            case "voice": return "Voice";
            default: return "Clarity";
        }
    };

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
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center min-h-[300px]">
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Carregando exercícios...</p>
                                </div>
                            </div>
                        ) : exercises.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center min-h-[300px]">
                                <div className="text-center space-y-2">
                                    <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                                    <p className="text-muted-foreground">Nenhum exercício disponível no momento.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {exercises.map((group, i) => (
                                    <ExerciseCard 
                                        key={i} 
                                        exercise={{
                                            tipo: mapTipo(group.tipo),
                                            origem: group.origem as "global" | "personalizado",
                                            data: group.data[0]?.dados_exercicio ?? {},
                                        }}
                                        onClick={() => navigate(`/exercises/${group.tipo}/${group.data[0]?.id}`)} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};

export default Exercises;
