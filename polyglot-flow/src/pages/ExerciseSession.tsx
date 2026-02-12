import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClarityExercise } from "@/components/exercises/ClarityExercise";
import { EchoExercise } from "@/components/exercises/EchoExercise";
import { NexusExercise } from "@/components/exercises/NexusExercise";
import { ResultModal } from "@/components/exercises/ResultModal";
import { ExitModal } from "@/components/exercises/ExitModal";
import { exerciseService } from "@/services/exerciseService";

const ExerciseSession = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [exercise, setExercise] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showResult, setShowResult] = useState(false);
    const [showExit, setShowExit] = useState(false);
    const [score, setScore] = useState(0);
    const [nextId, setNextId] = useState<string | null>(null);

    // TODO: pegar user_id do contexto de auth quando implementado
    const userId = 1;

    useEffect(() => {
        loadExercise();
    }, [type, id]);

    const loadExercise = async () => {
        setLoading(true);
        try {
            if (!type || !id) return;

            const groups = await exerciseService.listGrouped(userId);

            // Find group by type (backend already maps ClaritySprint → Clarity, etc.)
            const group = groups.find(g =>
                g.tipo.toLowerCase() === type.toLowerCase()
            );

            if (group) {
                // Find specific exercise in data array by ID
                const currentIndex = group.data.findIndex((item: any) => String(item.id) === id);

                if (currentIndex !== -1) {
                    const specificExercise = group.data[currentIndex];

                    // Construct the exercise object merging group info with specific item data
                    // Use dados_exercicio from the API (the JSONB payload)
                    setExercise({
                        tipo: group.tipo,
                        origem: group.origem,
                        data: specificExercise.dados_exercicio ?? specificExercise,
                    });

                    // Check for next exercise
                    if (currentIndex + 1 < group.data.length) {
                        setNextId(String(group.data[currentIndex + 1].id));
                    } else {
                        setNextId(null);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load exercise:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = (finalScore: number) => {
        setScore(finalScore);
        setShowResult(true);
    };

    const handleExitRequest = () => {
        setShowExit(true);
    };

    const handleExitConfirm = () => {
        navigate('/exercises');
    };

    const handleRetry = () => {
        setShowResult(false);
        window.location.reload(); 
    };

    const handleNext = () => {
        if (nextId) {
            setShowResult(false);
            navigate(`/exercises/${type}/${nextId}`);
        }
    };

    // Show loading while the API call is in progress
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Carregando exercício...</p>
                </div>
            </div>
        );
    }

    if (!exercise) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Exercício não encontrado</h2>
                    <Button onClick={() => navigate('/exercises')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para lista
                    </Button>
                </div>
            </div>
        );
    }

    // Map tipo to component name (backend sends "Clarity", "Echo", "Nexus")
    const tipoLower = exercise.tipo.toLowerCase();

    return (
        <div className="min-h-screen bg-background relative flex flex-col">
            {/* Top Navigation Bar */}
            <div className="w-full flex justify-between items-center p-6 fixed top-0 left-0 z-50">
                <Button variant="ghost" size="icon" onClick={handleExitRequest} className="hover:bg-destructive/10 hover:text-destructive rounded-full">
                    <X className="w-6 h-6" />
                </Button>
                
                <div className="text-xs font-mono text-muted-foreground opacity-50 uppercase tracking-widest">
                    {exercise.origem} • {exercise.tipo}
                </div>
                
                <div className="w-10" /> {/* Spacer for balance */}
            </div>

            {/* Exercise Content */}
            <main className="flex-1 flex items-center justify-center p-4 pt-20 animate-in fade-in zoom-in-95 duration-500">
                {tipoLower === "clarity" && (
                    <ClarityExercise 
                        key={showResult ? 'completed' : 'active'}
                        data={exercise.data} 
                        onComplete={handleComplete} 
                        onExit={handleExitRequest} 
                    />
                )}
                
                {tipoLower === "echo" && (
                    <EchoExercise 
                        key={showResult ? 'completed' : 'active'}
                        data={exercise.data} 
                        onComplete={handleComplete} 
                        onExit={handleExitRequest} 
                    />
                )}

                {tipoLower === "nexus" && (
                    <NexusExercise 
                        key={showResult ? 'completed' : 'active'}
                        data={exercise.data} 
                        onComplete={handleComplete} 
                        onExit={handleExitRequest} 
                    />
                )}
            </main>

            {/* Modals */}
            <ResultModal 
                open={showResult} 
                score={score} 
                onRetry={handleRetry} 
                onExit={() => navigate('/exercises')}
                onNext={handleNext}
                hasNext={!!nextId}
            />
            
            <ExitModal
                open={showExit}
                onCancel={() => setShowExit(false)}
                onConfirm={handleExitConfirm}
            />
        </div>
    );
};

export default ExerciseSession;
