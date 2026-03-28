import { useState, useRef, useEffect, useCallback } from "react";
import { exerciseService } from "@/services/exerciseService";
import type { WordEntry, ChainExerciseData } from "./types";

const WORD_LIMIT = 10;

export function useChainExercise(data: ChainExerciseData, onComplete: (score: number) => void) {
  const [words, setWords] = useState<WordEntry[]>([{ text: data.palavra_inicial, from: "initial" }]);
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const sentenceRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when loading state changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  // Auto-scroll sentence area when words update
  useEffect(() => {
    if (sentenceRef.current) {
      sentenceRef.current.scrollTop = sentenceRef.current.scrollHeight;
    }
  }, [words]);

  const getSentence = (wordList: WordEntry[]) => wordList.map((w) => w.text).join(" ");

  const finish = useCallback((wordList: WordEntry[]) => {
    setIsFinished(true);
    setTimeout(() => onComplete(100), 1500);
    return wordList;
  }, [onComplete]);

  const handleSubmit = useCallback(async (inputValue: string) => {
    const word = inputValue.trim();
    if (!word || loading || isFinished || word.includes(" ")) return;

    const newWords: WordEntry[] = [...words, { text: word, from: "user" }];
    setWords(newWords);
    setTurnCount((t) => t + 1);

    if (newWords.length >= WORD_LIMIT) {
      finish(newWords);
      return;
    }

    setLoading(true);
    try {
      const sentence = getSentence(newWords);
      const resp = await exerciseService.chainNextWord(sentence);
      const aiWord = resp.nextword;
      const withAi: WordEntry[] = [...newWords, { text: aiWord, from: "ai" }];
      setWords(withAi);
      setTurnCount((t) => t + 1);
      if (withAi.length >= WORD_LIMIT) finish(withAi);
    } catch (error) {
      console.error("Chain AI error:", error);
    } finally {
      setLoading(false);
    }
  }, [words, loading, isFinished, finish]);

  const handleRestart = useCallback(() => {
    setWords([{ text: data.palavra_inicial, from: "initial" }]);
    setIsFinished(false);
    setTurnCount(0);
    setLoading(false);
  }, [data.palavra_inicial]);

  return {
    words, loading, isFinished, turnCount,
    inputRef, sentenceRef,
    getSentence, handleSubmit, handleRestart,
  };
}
