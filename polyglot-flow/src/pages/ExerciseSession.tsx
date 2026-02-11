import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClarityExercise } from "@/components/exercises/ClarityExercise";
import { EchoExercise } from "@/components/exercises/EchoExercise";
import { NexusExercise } from "@/components/exercises/NexusExercise";
import { ResultModal } from "@/components/exercises/ResultModal";

import { ExitModal } from "@/components/exercises/ExitModal";

const EXERCISE_DATA = [
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
    "tipo": "NexusConnect", // Mapped to Nexus
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
      },
      {
        "id": 206,
        "instrucao": "Arraste para o sinônimo correto",
        "palavra_central": "double",
        "opcoes": [
          { "texto": "duplicate", "correta": true },
          { "texto": "doubt", "correta": false }
        ],
        "tema": "vocabulario_geral"
      }
    ]
  }
];

const ExerciseSession = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [exercise, setExercise] = useState<any>(null);
    const [showResult, setShowResult] = useState(false);
    const [showExit, setShowExit] = useState(false);
    const [score, setScore] = useState(0);

    const [nextId, setNextId] = useState<string | null>(null);

    useEffect(() => {
        // Find group by Type
        const group = EXERCISE_DATA.find(e => 
            e.tipo.toLowerCase() === type?.toLowerCase() || 
            (e.tipo === "NexusConnect" && type?.toLowerCase() === "nexus")
        );

        if (group) {
            // Find specific exercise in data array by ID
            const currentIndex = group.data.findIndex((item: any) => String(item.id) === id);
            
            if (currentIndex !== -1) {
                const specificExercise = group.data[currentIndex];
                
                // Construct the exercise object merging group info with specific item data
                setExercise({
                    tipo: group.tipo,
                    origem: group.origem,
                    data: specificExercise
                });

                // Check for next exercise
                if (currentIndex + 1 < group.data.length) {
                    setNextId(String(group.data[currentIndex + 1].id));
                } else {
                    setNextId(null);
                }
            }
        }
    }, [type, id]);

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
                {exercise.tipo === "Clarity" && (
                    <ClarityExercise 
                        key={showResult ? 'completed' : 'active'}
                        data={exercise.data} 
                        onComplete={handleComplete} 
                        onExit={handleExitRequest} 
                    />
                )}
                
                {exercise.tipo === "Echo" && (
                    <EchoExercise 
                        key={showResult ? 'completed' : 'active'}
                        data={exercise.data} 
                        onComplete={handleComplete} 
                        onExit={handleExitRequest} 
                    />
                )}

                {exercise.tipo === "NexusConnect" && (
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
