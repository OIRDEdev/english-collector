import React from "react";
import { cn } from "@/lib/utils";

interface ResultOverlayProps {
  visible: boolean;
  emoji?: string;
  title: string;
  subtitle?: string;
}

/**
 * Absolute-positioned overlay for "Frase completa!" / success screens.
 * Parent must have `position: relative` and `overflow: hidden`.
 */
const ResultOverlay = React.memo(function ResultOverlay({
  visible,
  emoji = "🎉",
  title,
  subtitle,
}: ResultOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        "bg-background/40 backdrop-blur-sm rounded-2xl",
        "animate-in fade-in duration-300"
      )}
    >
      <div className="text-center space-y-3 animate-in zoom-in-90 duration-500">
        {emoji && <div className="text-4xl">{emoji}</div>}
        <p className="text-lg font-bold text-emerald-400">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            &ldquo;{subtitle}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
});

export default ResultOverlay;
