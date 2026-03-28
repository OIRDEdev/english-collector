import { useState, useCallback, useEffect } from "react";
import type { WordMemoryData, WordStatus } from "./types";

export function useWordMemory(data: WordMemoryData, onComplete: (score: number) => void) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(data.data.timeLimit);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState<WordStatus[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const totalWords = data.data.wordList?.length || 0;
  const correctCount = results.filter((r) => r === "correct").length;
  const answeredCount = results.filter((r) => r !== "pending").length;
  const currentWord = data.data.wordList?.[currentIndex];

  const finish = useCallback(() => {
    setIsFinished(true);
    const score = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;
    setTimeout(() => onComplete(score), 2000);
  }, [correctCount, totalWords, onComplete]);

  // Timer
  useEffect(() => {
    if (!isStarted || isFinished) return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isStarted, isFinished, timeLeft, finish]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isFinished || feedback || !currentWord) return;

    const answer = input.trim().toLowerCase();
    const expected = currentWord.en.toLowerCase();
    const isCorrect = answer === expected;

    setResults((prev) => {
      const next = [...prev];
      next[currentIndex] = isCorrect ? "correct" : "wrong";
      return next;
    });

    if (isCorrect) {
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      setFeedback(null);
      setInput("");
      if (currentIndex + 1 < totalWords) {
        setCurrentIndex((i) => i + 1);
      } else {
        finish();
      }
    }, isCorrect ? 600 : 1200);
  }, [input, isFinished, feedback, currentWord, currentIndex, totalWords, finish]);

  const progressPercent = totalWords > 0 ? (answeredCount / totalWords) * 100 : 0;
  const timePercent = data.data.timeLimit > 0 ? (timeLeft / data.data.timeLimit) * 100 : 100;

  return {
    currentIndex, input, setInput,
    timeLeft, isStarted, setIsStarted,
    isFinished, feedback, streak, bestStreak,
    totalWords, correctCount, answeredCount,
    currentWord, progressPercent, timePercent,
    handleSubmit,
  };
}
