import { useState, useRef, useEffect, useCallback } from "react";
import type { EchoData } from "./types";

export function useEchoExercise(data: EchoData, onComplete: (score: number) => void) {
  const [userInput, setUserInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePlay = useCallback(() => {
    // Mock play logic for now
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  }, []);

  const checkAnswer = useCallback(() => {
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,!?;:]/g, "");
    const expected = normalize(data.parte_oculta);
    const actual = normalize(userInput);
    
    let score = 0;
    if (actual === expected) {
      score = 100;
    } else if (expected.includes(actual) && actual.length > expected.length / 2) {
      score = 50;
    }

    setIsFinished(true);
    setTimeout(() => onComplete(score), 2000);
  }, [data.parte_oculta, userInput, onComplete]);

  return {
    userInput, setUserInput,
    isPlaying, isFinished,
    inputRef, audioRef,
    handlePlay, checkAnswer
  };
}
