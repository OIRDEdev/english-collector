import React from "react";

interface ExerciseHeaderProps {
  /** e.g. "SENTENCE" */
  title: string;
  /** e.g. "BUILDER" */
  accent: string;
  /** Tailwind text color class, e.g. "text-cyan-400" */
  accentColor?: string;
  /** Optional subtitle below the heading */
  subtitle?: string;
  /** Optional content rendered on the right side (timer, level badge…) */
  right?: React.ReactNode;
}

const ExerciseHeader = React.memo(function ExerciseHeader({
  title,
  accent,
  accentColor = "text-primary",
  subtitle,
  right,
}: ExerciseHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold font-mono italic tracking-tighter">
          <span className="text-foreground">{title}</span>
          <span className={accentColor}>{accent}</span>
        </h2>
        {subtitle && (
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
});

export default ExerciseHeader;
