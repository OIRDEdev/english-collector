import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCw, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultModalProps {
  open: boolean;
  score: number;
  onRetry: () => void;
  onExit: () => void;
  maxScore?: number;
  onNext?: () => void;
  hasNext?: boolean;
}

export function ResultModal({ open, score, onRetry, onExit, onNext, hasNext, maxScore = 100 }: ResultModalProps) {
  const isSuccess = score >= 70; // Threshold for success
  
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md border-0 bg-background/80 backdrop-blur-xl shadow-2xl p-0 overflow-hidden outline-none">
         <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
            
            {/* Icon */}
            <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-500",
                isSuccess ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
                {isSuccess ? (
                    <CheckCircle2 className="w-10 h-10" />
                ) : (
                    <XCircle className="w-10 h-10" />
                )}
            </div>

            {/* Content */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                    {isSuccess ? "Exercício Concluído!" : "Precisa de Prática"}
                </h2>
                <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">
                    {isSuccess 
                        ? `Parabéns! Você alcançou uma pontuação excelente de ${score} pontos.`
                        : `Você fez ${score} pontos. Tente novamente para melhorar seu desempenho.`
                    }
                </p>
            </div>

            {/* Score Bar */}
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                    className={cn(
                        "h-full transition-all duration-1000 ease-out",
                        isSuccess ? "bg-green-500" : "bg-red-500"
                    )}
                    style={{ width: `${(score / maxScore) * 100}%` }}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full pt-2">
                <Button variant="outline" className="flex-1" onClick={onRetry}>
                    <RotateCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                </Button>
                
                {hasNext && isSuccess && onNext ? (
                    <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onNext}>
                        Próximo
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button className={cn(
                        "flex-1",
                        isSuccess ? "bg-green-500 hover:bg-green-600 text-white" : ""
                    )} onClick={onExit}>
                        Concluir
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>

         </div>
      </DialogContent>
    </Dialog>
  );
}
