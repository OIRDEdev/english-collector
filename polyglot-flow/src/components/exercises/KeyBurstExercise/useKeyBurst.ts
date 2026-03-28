import { useState, useMemo, useCallback } from "react";
import type { KeyBurstData } from "./types";

export function useKeyBurst(data: KeyBurstData, onComplete: (score: number) => void) {
  const [currentInput, setCurrentInput] = useState<{ char: string; keyIndex: number }[]>([]);
  const [usedKeys, setUsedKeys] = useState<Set<number>>(new Set());
  const [lives, setLives] = useState(3);
  const [isFinished, setIsFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [shakeSlots, setShakeSlots] = useState(false);

  const answer = data.resposta.toUpperCase();
  const distractors = data.distratores.toUpperCase();

  // Shuffle letters ONCE
  const keys = useMemo(() => {
    const allChars = (answer + distractors).split("");
    for (let i = allChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
    }
    return allChars;
  }, [answer, distractors]);

  const addLetter = useCallback((char: string, keyIndex: number) => {
    if (isFinished || currentInput.length >= answer.length) return;

    const newInput = [...currentInput, { char, keyIndex }];
    setCurrentInput(newInput);
    setUsedKeys(prev => new Set(prev).add(keyIndex));

    if (newInput.length === answer.length) {
      const result = newInput.map(i => i.char).join("");
      if (result === answer) {
        setWon(true);
        setIsFinished(true);
        const score = lives === 3 ? 100 : lives === 2 ? 75 : 50;
        setTimeout(() => onComplete(score), 1800);
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        setShakeSlots(true);
        setTimeout(() => {
          setShakeSlots(false);
          if (newLives <= 0) {
            setIsFinished(true);
            setTimeout(() => onComplete(0), 1000);
          } else {
            setCurrentInput([]);
            setUsedKeys(new Set());
          }
        }, 600);
      }
    }
  }, [currentInput, isFinished, answer, lives, onComplete]);

  const clearLast = useCallback(() => {
    if (isFinished || currentInput.length === 0) return;
    const last = currentInput[currentInput.length - 1];
    setCurrentInput(prev => prev.slice(0, -1));
    setUsedKeys(prev => {
      const next = new Set(prev);
      next.delete(last.keyIndex);
      return next;
    });
  }, [isFinished, currentInput]);

  return {
    keys, currentInput, usedKeys, lives,
    isFinished, won, shakeSlots, answer,
    addLetter, clearLast
  };
}
