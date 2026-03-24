import { useEffect, useRef, useState } from "react";

/**
 * KeyBurst card animation — letter slots fill in one by one. 
 * One letter is wrong (shakes red), then gets corrected.
 * Pure CSS animations + minimal JS for sequence.
 */
const KeyBurstAnimation = () => {
  const word = "FUNCTION";
  const attempt = ["F", "U", "X", "C", "T", "I", "O", "N"]; // X is wrong
  const poolLetters = ["F", "U", "N", "C", "T", "I", "O"];
  const indexRef = useRef(0);
  type SlotState = { letter: string; state: "empty" | "filling" | "error" | "correct" };
  const [slots, setSlots] = useState<SlotState[]>(
    word.split("").map(() => ({ letter: "", state: "empty" }))
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    const reset = () => {
      setSlots(word.split("").map(() => ({ letter: "", state: "empty" })));
      indexRef.current = 0;
      timeoutRef.current = setTimeout(step, 800);
    };

    const step = () => {
      const i = indexRef.current;

      if (i >= attempt.length) {
        timeoutRef.current = setTimeout(reset, 2500);
        return;
      }

      const letter = attempt[i];
      const isCorrect = letter === word[i];

      setSlots((prev) => {
        const next = [...prev];
        next[i] = { letter, state: isCorrect ? "correct" : "error" };
        return next;
      });

      if (!isCorrect) {
        const errIdx = i;

        timeoutRef.current = setTimeout(() => {
          setSlots((prev) => {
            const next = [...prev];
            next[errIdx] = { letter: "", state: "empty" };
            return next;
          });

          timeoutRef.current = setTimeout(() => {
            setSlots((prev) => {
              const next = [...prev];
              next[errIdx] = { letter: word[errIdx], state: "correct" };
              return next;
            });

            indexRef.current++;
            timeoutRef.current = setTimeout(step, 300);
          }, 300);
        }, 500);
      } else {
        indexRef.current++;
        timeoutRef.current = setTimeout(step, 300);
      }
    };

    timeoutRef.current = setTimeout(step, 800);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none gap-4">
      {/* Slots */}
      <div className="flex gap-1.5">
        {slots.map((slot, idx) => (
          <div
            key={idx}
            className="w-6 h-8 rounded flex items-center justify-center text-sm font-bold"
            style={{
              border: `1px solid ${
                slot.state === "error" ? "#ef4444" :
                slot.state === "correct" ? "#22c55e" : "#374151"
              }`,
              color: slot.state === "correct" ? "#22c55e" : slot.state === "error" ? "#ef4444" : "#e2e8f0",
              animation:
                slot.state === "error" ? "kb-shake 0.3s ease" :
                slot.state === "correct" || slot.state === "filling" ? "kb-pop 0.2s ease" : "none",
              transition: "border-color 0.2s",
            }}
          >
            {slot.letter}
          </div>
        ))}
      </div>

      {/* Pool letters */}
      <div className="flex gap-2">
        {poolLetters.map((l, i) => (
          <span key={i} className="text-xs opacity-50 text-slate-400">{l}</span>
        ))}
      </div>

      <style>{`
        @keyframes kb-pop {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes kb-shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
};

export default KeyBurstAnimation;
