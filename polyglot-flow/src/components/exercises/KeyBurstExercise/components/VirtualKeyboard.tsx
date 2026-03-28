import React from "react";
import { cn } from "@/lib/utils";

interface VirtualKeyboardProps {
  keys: string[];
  usedKeys: Set<number>;
  isFinished: boolean;
  onAddLetter: (char: string, keyIndex: number) => void;
}

const VirtualKeyboard = React.memo(function VirtualKeyboard({
  keys,
  usedKeys,
  isFinished,
  onAddLetter,
}: VirtualKeyboardProps) {
  // Compute grid cols
  const gridCols =
    keys.length <= 10 ? "grid-cols-5" : keys.length <= 14 ? "grid-cols-7" : "grid-cols-8";

  return (
    <div className={cn("grid gap-3 max-w-sm mx-auto", gridCols)}>
      {keys.map((char, i) => {
        const isUsed = usedKeys.has(i);
        return (
          <button
            key={i}
            onClick={() => onAddLetter(char, i)}
            disabled={isUsed || isFinished}
            className={cn(
              "h-14 rounded-xl font-bold text-xl uppercase transition-all duration-150",
              "shadow-[0_4px_0_rgba(30,33,39,1)] m-5",
              "active:translate-y-0.5 active:shadow-[0_2px_0_rgba(30,33,39,1)]",
              isUsed
                ? "opacity-20 pointer-events-none grayscale bg-white/5 text-muted-foreground"
                : "bg-[hsl(220,14%,30%)] text-white hover:bg-[hsl(220,14%,38%)]"
            )}
          >
            {char}
          </button>
        );
      })}
    </div>
  );
});

export default VirtualKeyboard;
