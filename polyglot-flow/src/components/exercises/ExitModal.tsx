import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface ExitModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExitModal({ open, onCancel, onConfirm }: ExitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md border-0 bg-background/80 backdrop-blur-xl shadow-2xl p-0 overflow-hidden outline-none">
         <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
            
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                <AlertCircle className="w-8 h-8" />
            </div>

            {/* Content */}
            <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight">
                    Sair do exercício?
                </h2>
                <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">
                    Se você sair agora, todo o seu progresso atual será perdido.
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full pt-2">
                <Button variant="outline" className="flex-1" onClick={onCancel}>
                    Continuar
                </Button>
                <Button variant="destructive" className="flex-1" onClick={onConfirm}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Sair
                </Button>
            </div>

         </div>
      </DialogContent>
    </Dialog>
  );
}
