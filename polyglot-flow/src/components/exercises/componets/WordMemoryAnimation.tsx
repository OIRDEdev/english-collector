import { useEffect, useRef, useState } from "react";

/**
 * WordMemory card animation — a word appears, letters type into an input field one by one.
 * Pure CSS animations, minimal JS for the typing sequence.
 */
const WordMemoryAnimation = () => {
  const word = "house";
  const displayWord = "casa";
  const [typed, setTyped] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let i = 0;
    const startDelay = setTimeout(() => {
      const tick = () => {
        if (i < word.length) {
          setTyped((prev) => [...prev, word[i]]);
          i++;
          if (i >= word.length) setDone(true);
          intervalRef.current = setTimeout(tick, 400);
        } else {
          // Restart loop
          setTimeout(() => {
            setTyped([]);
            setDone(false);
            i = 0;
            intervalRef.current = setTimeout(tick, 600);
          }, 2500);
        }
      };
      tick();
    }, 800);

    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
      {/* Target word */}
      <span
        className="text-2xl font-bold tracking-wide"
        style={{
          color: "#e879f9",
          textShadow: "0 0 20px rgba(232,121,249,0.3)",
        }}
      >
        {displayWord}
      </span>

      {/* Fake input */}
      <div
        className="mt-6 flex items-center rounded-lg px-3 min-h-[36px] min-w-[120px]"
        style={{
          border: `1px solid ${done ? "#22c55e" : "#9333ea"}`,
          boxShadow: done ? "0 0 15px rgba(34,197,94,0.3)" : "none",
          transition: "box-shadow 0.4s, border-color 0.4s",
        }}
      >
        {typed.map((letter, idx) => (
          <span
            key={idx}
            className="text-sm font-medium"
            style={{
              color: done && idx === typed.length - 1 ? "#22c55e" : "#e2e8f0",
              animation: "wm-appear 0.2s ease forwards",
            }}
          >
            {letter}
          </span>
        ))}
        {!done && (
          <span
            className="ml-0.5 inline-block w-[2px] h-4"
            style={{
              background: "#e879f9",
              animation: "wm-blink 1s infinite",
            }}
          />
        )}
      </div>

      {/* Timer bar */}
      <div
        className="absolute bottom-0 left-0 h-[3px] rounded-b-2xl"
        style={{
          background: "linear-gradient(to right, #a855f7, #ec4899)",
          animation: "wm-countdown 5s linear infinite",
        }}
      />

      <style>{`
        @keyframes wm-appear {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wm-blink {
          0%,100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes wm-countdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default WordMemoryAnimation;
