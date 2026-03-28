import { useState, useEffect, useCallback, useRef } from "react";
import type { HistoriaData, Phase } from "./types";

export function useHistoriaExercise(data: HistoriaData, onComplete: (score: number) => void, onExit: () => void) {
  const questions = data["perguntas do texto"] ?? data.perguntas_do_texto ?? {};
  const questionEntries = Object.entries(questions);
  const readingTime = data.tempo_leitura || Math.max(30, Math.ceil(data.texto.split(/\s+/).length / 4));

  const [phase, setPhase] = useState<Phase>("reading");
  const [timeLeft, setTimeLeft] = useState(readingTime);

  useEffect(() => {
    setTimeLeft(readingTime);
  }, [readingTime]);

  // Timer countdown — isolated so it doesn't cause question list re-renders
  useEffect(() => {
    if (phase !== "reading" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, onExit]); // intentionally omit timeLeft to avoid re-creating interval every second

  const timerProgress = (timeLeft / readingTime) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ─── Answers & Results state ───
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [clickTarget, setClickTarget] = useState<string | null>(null);
  const [clickedCorrect, setClickedCorrect] = useState<Record<string, boolean>>({});
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  // ─── Refs for scrolling ───
  const textRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const goToQuestions = useCallback(() => setPhase("questions"), []);

  const handleAnswerChange = useCallback((key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const activateClickMode = useCallback((key: string) => {
    setClickTarget(key);
    setSelectedWordIndex(null);
    textRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleTextClick = useCallback((_word: string, wordIndex: number) => {
    setSelectedWordIndex(wordIndex);
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (!clickTarget || selectedWordIndex === null) return;
    const q = questions[clickTarget];
    if (!q?.trecho_alvo) return;

    const words = data.texto.split(/\s+/);
    const word = words[selectedWordIndex];

    const normalize = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "");

    const targetWords = q.trecho_alvo.split(/\s+/).map(normalize).filter(Boolean);
    const cleanWord = normalize(word);

    if (targetWords.includes(cleanWord)) {
      setClickedCorrect((prev) => ({ ...prev, [clickTarget]: true }));
      setAnswers((prev) => ({ ...prev, [clickTarget]: q.trecho_alvo! }));
      const currentTarget = clickTarget;
      setClickTarget(null);
      setSelectedWordIndex(null);
      setTimeout(() => {
        const el = questionRefs.current[currentTarget];
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      setSelectedWordIndex(null);
    }
  }, [clickTarget, selectedWordIndex, questions, data.texto]);

  const handleSubmit = useCallback(() => {
    const newResults: Record<string, boolean> = {};
    let correct = 0;

    for (const [key, q] of questionEntries) {
      const answer = answers[key] || "";
      if (q.resposta_correta) {
        const isCorrect = answer === q.resposta_correta;
        newResults[key] = isCorrect;
        if (isCorrect) correct++;
      } else if (q.trecho_alvo) {
        const isCorrect = clickedCorrect[key] === true;
        newResults[key] = isCorrect;
        if (isCorrect) correct++;
      } else if (q.resposta) {
        const normalizedAnswer = answer.toLowerCase().trim();
        const correctWords = q.resposta.toLowerCase().trim().split(/\s+/);
        const matchCount = correctWords.filter((w) => normalizedAnswer.includes(w)).length;
        const isCorrect = matchCount / correctWords.length >= 0.3;
        newResults[key] = isCorrect;
        if (isCorrect) correct++;
      }
    }

    setResults(newResults);
    setPhase("results");
    const score = questionEntries.length > 0 ? Math.round((correct / questionEntries.length) * 100) : 100;
    setTimeout(() => onComplete(score), 3000);
  }, [questionEntries, answers, clickedCorrect, onComplete]);

  const allAnswered = questionEntries.every(([key, q]) => {
    if (q.trecho_alvo) return clickedCorrect[key] === true;
    return !!answers[key];
  });

  return {
    phase, timeLeft, timerProgress, formatTime,
    questions, questionEntries,
    answers, results, clickTarget, clickedCorrect, selectedWordIndex, allAnswered,
    textRef, questionRefs,
    goToQuestions, handleAnswerChange, activateClickMode,
    handleTextClick, handleConfirmSelection, handleSubmit,
  };
}
