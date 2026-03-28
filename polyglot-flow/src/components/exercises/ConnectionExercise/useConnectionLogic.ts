import { useState, useEffect, useRef, useCallback } from "react";

interface UseConnectionLogicArgs {
  connectors: string[];
  correctAnswer: string;
  timeLimit: number;
  onComplete: (score: number) => void;
}

export function useConnectionLogic({
  connectors,
  correctAnswer,
  timeLimit,
  onComplete,
}: UseConnectionLogicArgs) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isStarted, setIsStarted] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Stable shuffle — computed only once at mount
  const [shuffled] = useState<string[]>(() => {
    const arr = [...connectors];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const selectedWord = shuffled[selectedIndex];
  const isCorrect = selectedWord === correctAnswer;

  const handleConfirm = useCallback(() => {
    if (confirmed) return;
    setConfirmed(true);
    const score = selectedWord === correctAnswer ? 100 : 0;
    setTimeout(() => onComplete(score), 2500);
  }, [confirmed, selectedWord, correctAnswer, onComplete]);

  const handleScroll = useCallback((direction: "up" | "down") => {
    if (confirmed) return;
    setSelectedIndex((i) => {
      if (direction === "up") return i > 0 ? i - 1 : shuffled.length - 1;
      return i < shuffled.length - 1 ? i + 1 : 0;
    });
  }, [confirmed, shuffled.length]);

  // Timer countdown
  useEffect(() => {
    if (!isStarted || confirmed) return;
    if (timeLeft <= 0) { handleConfirm(); return; }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [isStarted, confirmed, timeLeft, handleConfirm]);

  // Keyboard navigation
  useEffect(() => {
    if (!isStarted || confirmed) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault(); handleScroll("up");
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault(); handleScroll("down");
      } else if (e.key === "Enter") {
        e.preventDefault(); handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isStarted, confirmed, handleScroll, handleConfirm]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return {
    selectedIndex, confirmed, timeLeft, isStarted,
    shuffled, selectedWord, isCorrect,
    selectorRef,
    setIsStarted, setSelectedIndex,
    handleConfirm, handleScroll, formatTime,
  };
}
