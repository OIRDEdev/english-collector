import React from "react";
import { cn } from "@/lib/utils";

interface AnswerSlotsProps {
  answerLength: number;
  currentInput: { char: string; keyIndex: number }[];
  shakeSlots: boolean;
  won: boolean;
}

const AnswerSlots = React.memo(function AnswerSlots({
  answerLength,
  currentInput,
  shakeSlots,
  won,
}: AnswerSlotsProps) {
  return (
    <div
      className={cn(
        "flex justify-center flex-wrap gap-2",
        shakeSlots && "animate-[shake_0.4s_ease-in-out]"
      )}
    >
      {Array.from({ length: answerLength }).map((_, i) => {
        const filled = i < currentInput.length;
        const char = filled ? currentInput[i].char : "";

        return (
          <div
            key={i}
            className={cn(
              "w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-black font-mono uppercase transition-all duration-200 border-2",
              filled
                ? won
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-400 animate-[bounce_0.5s_ease_infinite] shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                  : "border-cyan-400 bg-cyan-400/5 text-cyan-400 -translate-y-0.5"
                : "border-white/10 text-muted-foreground/30"
            )}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
});

export default AnswerSlots;
