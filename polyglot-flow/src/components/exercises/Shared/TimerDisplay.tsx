import React from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  timeLeft: number;
  formatTime: (s: number) => string;
  /** Threshold below which the display turns red. Default: 10 */
  warnAt?: number;
  /** Active color class e.g. "text-emerald-400". Default: "text-emerald-400" */
  color?: string;
  /** Active border/bg classes. Default: emerald palette */
  variant?: "emerald" | "lime" | "violet";
}

const VARIANTS = {
  emerald: "border-emerald-500/20 bg-emerald-500/5",
  lime:    "border-lime-500/20 bg-lime-500/5",
  violet:  "border-violet-500/20 bg-violet-500/5",
} as const;

const COLORS = {
  emerald: "text-emerald-400",
  lime:    "text-lime-300",
  violet:  "text-violet-400",
} as const;

const TimerDisplay = React.memo(function TimerDisplay({
  timeLeft,
  formatTime,
  warnAt = 10,
  variant = "emerald",
}: TimerDisplayProps) {
  const isWarning = timeLeft <= warnAt;
  return (
    <div
      className={cn(
        "flex items-center gap-3 backdrop-blur-md rounded-full px-5 py-2.5 border transition-colors duration-300",
        isWarning
          ? "border-red-500/30 bg-red-500/10"
          : VARIANTS[variant]
      )}
    >
      <Timer className={cn("w-4 h-4", isWarning ? "text-red-400" : COLORS[variant])} />
      <span
        className={cn(
          "text-xl font-bold font-mono tabular-nums",
          isWarning ? "text-red-400" : COLORS[variant]
        )}
      >
        {formatTime(timeLeft)}
      </span>
    </div>
  );
});

export default TimerDisplay;
