import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MemoryInputProps {
  input: string;
  setInput: (val: string) => void;
  feedback: "correct" | "wrong" | null;
  onSubmit: () => void;
  currentIndex: number;
  isStarted: boolean;
}

const MemoryInput = React.memo(function MemoryInput({
  input,
  setInput,
  feedback,
  onSubmit,
  currentIndex,
  isStarted,
}: MemoryInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus logic — targets the input immediately on word change
  useEffect(() => {
    if (isStarted && !feedback) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isStarted, feedback]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!!feedback}
        placeholder="Type the translation..."
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={cn(
          "w-full py-4 px-6 rounded-2xl bg-card/30 backdrop-blur-md border text-foreground text-center text-lg font-medium",
          "placeholder:text-muted-foreground/30 focus:outline-none transition-all duration-300",
          feedback
            ? "opacity-50 cursor-not-allowed border-white/5"
            : "border-white/10 focus:border-fuchsia-500/40 focus:shadow-[0_0_20px_rgba(217,70,239,0.1)]"
        )}
      />
      <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest">
        Pressione Enter para confirmar
      </p>
    </div>
  );
});

export default MemoryInput;
