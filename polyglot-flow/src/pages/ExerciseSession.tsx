import React, { Suspense, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { X, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultModal } from "@/components/exercises/ResultModal";
import { ExitModal } from "@/components/exercises/ExitModal";
import { exerciseService } from "@/services/exerciseService";
import type { ExerciseItem } from "@/types/api";

// ─── Lazy-loaded exercise registry — each chunk is only fetched when needed ───
const componentsMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
    echo:       React.lazy(() => import("@/components/exercises/EchoExercise").then(m => ({ default: m.EchoExercise }))),
    nexus:      React.lazy(() => import("@/components/exercises/NexusExercise").then(m => ({ default: m.NexusExercise }))),
    key:        React.lazy(() => import("@/components/exercises/KeyBurstExercise").then(m => ({ default: m.KeyBurstExercise }))),
    historia:   React.lazy(() => import("@/components/exercises/HistoriaExercise").then(m => ({ default: m.HistoriaExercise }))),
    chain:      React.lazy(() => import("@/components/exercises/ChainExercise").then(m => ({ default: m.ChainExercise }))),
    wordmemory: React.lazy(() => import("@/components/exercises/WordMemoryExercise").then(m => ({ default: m.WordMemoryExercise }))),
    connection: React.lazy(() => import("@/components/exercises/ConnectionExercise").then(m => ({ default: m.ConnectionExercise }))),
};

const ExerciseFallback = () => (
    <div className="flex items-center justify-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
);

const ExerciseSession = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // State passed from Exercises.tsx
    const navState = location.state as { exercises?: ExerciseItem[]; catalogName?: string } | null;

    const [exercise, setExercise] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showResult, setShowResult] = useState(false);
    const [showExit, setShowExit] = useState(false);
    const [score, setScore] = useState(0);
    const [nextId, setNextId] = useState<string | null>(null);
    const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);

    useEffect(() => {
        loadExercise();
    }, [type, id]);

    const loadExercise = async () => {
        setLoading(true);
        try {
            if (!type || !id) return;
            const exerciseId = parseInt(id, 10);
            if (isNaN(exerciseId)) return;

            const catalogName = navState?.catalogName || decodeURIComponent(type);

            // Use exercises from state if available, otherwise fallback to API
            let exercises = navState?.exercises;
            console.log(exercises);
            if (!exercises || exercises.length === 0) {
                // Fallback: fetch by ID and we won't have siblings
                const ex = await exerciseService.getById(exerciseId);

                setExercise({
                    tipo: catalogName,
                    data: ex.dados_exercicio ?? {},
                });
                setNextId(null);
                setAllExercises([]);
                return;
            }

            setAllExercises(exercises);

            // Find current exercise in the array
            const currentIndex = exercises.findIndex(e => e.id === exerciseId);
            const current = currentIndex !== -1 ? exercises[currentIndex] : exercises[0];

            setExercise({
                tipo: catalogName,
                data: current.dados_exercicio ?? {},
            });

            // Set next exercise ID
            if (currentIndex !== -1 && currentIndex + 1 < exercises.length) {
                setNextId(String(exercises[currentIndex + 1].id));
            } else {
                setNextId(null);
            }
        } catch (error) {
            console.error("Failed to load exercise:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (finalScore: number) => {
        setScore(finalScore);
        setShowResult(true);

        if (id) {
            const exerciseId = parseInt(id, 10);
            if (!isNaN(exerciseId)) {
                try {
                    await exerciseService.markAsViewed(exerciseId);
                } catch (err) {
                    console.error("Failed to mark exercise as viewed", err);
                }
            }
        }
    };

    const handleExitRequest = () => {
        setShowExit(true);
    };

    const handleExitConfirm = () => {
        if (type === "leituraimersa") {
            navigate('/historia');
        } else {
            navigate('/exercises');
        }
    };

    const handleRetry = () => {
        setShowResult(false);
        window.location.reload(); 
    };

    const handleNext = () => {
        if (nextId) {
            setShowResult(false);
            // Pass same exercises state to the next exercise
            navigate(`/exercises/${type}/${nextId}`, {
                state: { exercises: allExercises, catalogName: navState?.catalogName || decodeURIComponent(type || '') },
            });
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
                    <Button onClick={() => {
                        if (type === "leituraimersa") {
                            navigate('/historia');
                        } else {
                            navigate('/exercises');
                        }
                    }} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para lista
                    </Button>
                </div>
            </div>
        );
    }

    // Resolve component key from catalog name
    const catalogName = exercise.tipo.toLowerCase().replace(/\s+/g, '');
    const keyMap: Record<string, string> = {
        echowrite:     "echo",
        nexusconnect:  "nexus",
        keyburst:      "key",
        leituraimersa: "historia",
        sentencechain: "chain",
        wordmemory:    "wordmemory",
        connection:    "connection",
    };
    const componentKey = keyMap[catalogName] ?? catalogName;
    const ActiveComponent = componentsMap[componentKey] ?? null;

    return (
        <div className="min-h-screen bg-background relative flex flex-col">
            {/* Top Navigation Bar */}
            <div className="w-full flex justify-between items-center p-6 fixed top-0 left-0 z-50">
                <Button variant="ghost" size="icon" onClick={handleExitRequest} className="hover:bg-destructive/10 hover:text-destructive rounded-full">
                    <X className="w-6 h-6" />
                </Button>
                <div className="text-xs font-mono text-muted-foreground opacity-50 uppercase tracking-widest">
                    {exercise.tipo}
                </div>
                <div className="w-10" />
            </div>

            {/* Exercise Content — lazy loaded per exercise type */}
            <main className="flex-1 flex items-center justify-center p-4 pt-20 animate-in fade-in zoom-in-95 duration-500">
                {ActiveComponent ? (
                    <Suspense fallback={<ExerciseFallback />}>
                        <ActiveComponent
                            key={showResult ? 'completed' : 'active'}
                            data={exercise.data}
                            onComplete={handleComplete}
                            onExit={handleExitRequest}
                        />
                    </Suspense>
                ) : (
                    <p className="text-muted-foreground">Tipo de exercício desconhecido: {componentKey}</p>
                )}
            </main>

            {/* Modals */}
            <ResultModal 
                open={showResult} 
                score={score} 
                onRetry={handleRetry} 
                onExit={() => {
                    if (type === "leituraimersa") {
                        navigate('/historia');
                    } else {
                        navigate('/exercises');
                    }
                }}
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
