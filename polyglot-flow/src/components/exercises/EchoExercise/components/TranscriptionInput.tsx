import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TranscriptionInputProps {
  parts: string[];
  userInput: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  disabled: boolean;
  instruction: string;
  inputRef: React.RefObject<HTMLInputElement>;
}

const TranscriptionInput = React.memo(function TranscriptionInput({
  parts,
  userInput,
  onChange,
  onEnter,
  disabled,
  instruction,
  inputRef,
}: TranscriptionInputProps) {
  return (
    <>
      <div className="text-center space-y-2">
        <p className="text-xl font-medium text-muted-foreground/80">
          {parts[0]}
          <span
            className={cn(
              "mx-1 px-2 border-b-2 border-dashed transition-all duration-300",
              userInput ? "border-blue-500 text-foreground" : "border-muted-foreground/30 text-transparent"
            )}
          >
            {userInput || "___________"}
          </span>
          {parts[1] || ""}
        </p>
        <p className="text-sm text-muted-foreground/50 italic">{instruction}</p>
      </div>

      <div className="w-full max-w-md relative group/input">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
        <Input
          ref={inputRef}
          value={userInput}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter()}
          placeholder="Comece a digitar..."
          disabled={disabled}
          className="h-14 bg-background/50 border-white/10 text-center text-lg shadow-inner focus:ring-blue-500/50 focus:border-blue-500/50 transition-all rounded-xl relative z-10"
        />
      </div>
    </>
  );
});

export default TranscriptionInput;
