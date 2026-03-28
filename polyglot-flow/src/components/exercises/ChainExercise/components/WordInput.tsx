import React, { useState, useCallback } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface WordInputProps {
  loading: boolean;
  onSubmit: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const WordInput = React.memo(function WordInput({ loading, onSubmit, inputRef }: WordInputProps) {
  const [value, setValue] = useState("");

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only single words — strip spaces
    setValue(e.target.value.replace(/\s/g, ""));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit(value);
      setValue("");
    }
  }, [value, onSubmit]);

  const handleClick = useCallback(() => {
    onSubmit(value);
    setValue("");
  }, [value, onSubmit]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Next word..."
          className={cn(
            "w-full py-4 px-6 pr-14 rounded-2xl bg-card/30 backdrop-blur-md border text-foreground text-center text-lg font-medium",
            "placeholder:text-muted-foreground/40 focus:outline-none transition-all duration-300",
            loading
              ? "border-violet-500/20 opacity-50 cursor-not-allowed"
              : "border-white/10 focus:border-cyan-500/40 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
          )}
        />
        <button
          onClick={handleClick}
          disabled={loading || !value.trim()}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            value.trim() && !loading
              ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
              : "text-muted-foreground/30"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground/50 uppercase tracking-widest">
        Pressione Enter para enviar
      </p>
    </div>
  );
});

export default WordInput;
