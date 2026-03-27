import { RefreshCw, ChevronsRight} from "lucide-react";

interface MobileBottomBarProps {
  onRepeat: () => void;
  onContinue: () => void;
}

export function MobileBottomBar({ onRepeat, onContinue }: MobileBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-black/95 border-t border-zinc-900 backdrop-blur-xl z-50 px-6 py-2.5 flex items-center justify-center gap-12 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
       <button 
          onClick={onRepeat} 
          disabled
          className="flex flex-col items-center justify-center text-zinc-500 opacity-50 cursor-not-allowed"
       >
          <RefreshCw className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Repeat 10s</span>
       </button>
       
       <button 
          onClick={onContinue} 
          disabled
          className="flex flex-col items-center justify-center px-5 py-2.5 bg-zinc-800 text-zinc-500 rounded-xl border border-zinc-700 opacity-50 cursor-not-allowed"
       >
          <ChevronsRight className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-wider">Continue</span>
       </button>
    </div>
  );
}
