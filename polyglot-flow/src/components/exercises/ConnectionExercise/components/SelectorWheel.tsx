import React, { useRef, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectorWheelProps {
  shuffled: string[];
  selectedIndex: number;
  confirmed: boolean;
  onScroll: (dir: "up" | "down") => void;
  onSelect: (i: number) => void;
  onConfirm: () => void;
}

const SelectorWheel = React.memo(function SelectorWheel({
  shuffled,
  selectedIndex,
  confirmed,
  onScroll,
  onSelect,
  onConfirm,
}: SelectorWheelProps) {
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 30) onScroll(diff > 0 ? "down" : "up");
  }, [onScroll]);

  return (
    <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">
        Escolha o conector
      </p>

      <div
        className="relative w-full max-w-sm"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={() => onScroll("up")}
          className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-card/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-lime-500/30 transition-all"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <div className="py-6 space-y-2">
          {shuffled.map((word, i) => {
            const isSelected = i === selectedIndex;
            const distance = Math.abs(i - selectedIndex);
            return (
              <button
                key={word}
                onClick={() => onSelect(i)}
                className={cn(
                  "w-full py-3 px-6 rounded-xl text-center transition-all duration-300",
                  isSelected
                    ? "bg-lime-500/15 border-2 border-lime-500/40 text-lime-300 text-lg font-bold scale-105 shadow-[0_0_20px_rgba(132,204,22,0.1)]"
                    : "bg-card/10 border border-white/5 text-muted-foreground/50 hover:text-muted-foreground hover:border-white/10",
                  distance === 1 && !isSelected && "opacity-60 text-sm",
                  distance >= 2 && !isSelected && "opacity-30 text-xs"
                )}
              >
                {word}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onScroll("down")}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-card/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-lime-500/30 transition-all"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={onConfirm}
        className="mt-4 w-full max-w-sm py-4 rounded-xl bg-lime-500/20 border border-lime-500/30 text-lime-300 font-bold text-base hover:bg-lime-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Confirmar
      </button>
      <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
        ↑↓ para navegar • Enter para confirmar
      </p>
    </div>
  );
});

export default SelectorWheel;
