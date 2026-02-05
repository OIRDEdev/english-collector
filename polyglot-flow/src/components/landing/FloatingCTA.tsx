import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function FloatingCTA() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        size="lg"
        className="h-14 px-6 bg-primary text-primary-foreground hover:bg-primary/90 glow shadow-2xl animate-pulse-glow transition-all duration-300 hover:scale-105"
      >
        <Download className="w-5 h-5 mr-2" />
        Pronto para começar?
      </Button>
    </div>
  );
}
