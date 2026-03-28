import React from "react";
import { cn } from "@/lib/utils";
import type { NexusOption } from "../types";

interface OptionNodeProps {
  label: string; // "Opção A" or "Opção B"
  option: NexusOption;
  selectedOption: string | null;
  isFinished: boolean;
  onSelect: (option: NexusOption) => void;
}

const OptionNode = React.memo(function OptionNode({
  label,
  option,
  selectedOption,
  isFinished,
  onSelect,
}: OptionNodeProps) {
  const isSelected = selectedOption === option.texto;
  
  return (
    <button
      onClick={() => onSelect(option)}
      disabled={isFinished}
      className={cn(
        "w-full h-full rounded-2xl md:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-card/30 backdrop-blur-sm p-1 md:p-4",
        isSelected
          ? option.correta
            ? "border-green-500 bg-green-500/10"
            : "border-red-500 bg-red-500/10"
          : "border-white/10 text-muted-foreground hover:border-purple-500/50 hover:text-white"
      )}
    >
      <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground mb-1 md:mb-2 text-center">
        {label}
      </span>
      <span className="text-sm md:text-2xl font-bold text-center break-words">
        {option.texto}
      </span>
    </button>
  );
});

export default OptionNode;
