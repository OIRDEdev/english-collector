import { useState, useCallback } from "react";
import type { NexusOption } from "./types";

export function useNexusLogic(onComplete: (score: number) => void) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = useCallback((option: NexusOption) => {
    if (isFinished) return;
    
    setSelectedOption(option.texto);
    setIsFinished(true);

    const points = option.correta ? 100 : 0;
    setScore(points);

    // Simulated network delay or animation before completing
    setTimeout(() => onComplete(points), 1500);
  }, [isFinished, onComplete]);

  return {
    selectedOption,
    isFinished,
    score,
    handleSelect,
  };
}
