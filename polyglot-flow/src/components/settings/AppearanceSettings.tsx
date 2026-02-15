import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor, Type } from "lucide-react";

const THEMES = [
  {
    id: "dark",
    label: "Escuro",
    icon: Moon,
    preview: "bg-[#0a0a0f]",
    accent: "border-violet-500/30",
  },
  {
    id: "light",
    label: "Claro",
    icon: Sun,
    preview: "bg-[#f8f8fa]",
    accent: "border-amber-500/30",
  },
  {
    id: "system",
    label: "Sistema",
    icon: Monitor,
    preview: "bg-gradient-to-r from-[#0a0a0f] to-[#f8f8fa]",
    accent: "border-blue-500/30",
  },
];

const ACCENT_COLORS = [
  { id: "violet", label: "Violeta", color: "#8b5cf6", tw: "bg-violet-500" },
  { id: "emerald", label: "Esmeralda", color: "#10b981", tw: "bg-emerald-500" },
  { id: "cyan", label: "Ciano", color: "#06b6d4", tw: "bg-cyan-500" },
  { id: "rose", label: "Rosa", color: "#f43f5e", tw: "bg-rose-500" },
  { id: "amber", label: "Âmbar", color: "#f59e0b", tw: "bg-amber-500" },
  { id: "blue", label: "Azul", color: "#3b82f6", tw: "bg-blue-500" },
];

const FONT_SIZES = [
  { id: "small", label: "Pequeno", size: "text-xs" },
  { id: "medium", label: "Médio", size: "text-sm" },
  { id: "large", label: "Grande", size: "text-base" },
];

export function AppearanceSettings() {
  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState("violet");
  const [fontSize, setFontSize] = useState("medium");
  const [compactMode, setCompactMode] = useState(false);

  return (
    <div className="space-y-8">
      {/* Theme */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold mb-4">
          Tema
        </h4>

        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                  isActive
                    ? `${t.accent} bg-white/5`
                    : "border-white/5 bg-card/20 hover:bg-white/5"
                )}
              >
                <div className={cn("w-full h-16 rounded-lg", t.preview)} />
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-foreground" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {t.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Accent Color */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold mb-4">
          Cor de destaque
        </h4>

        <div className="bg-card/20 border border-white/5 rounded-xl p-4">
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setAccent(c.id)}
                className={cn(
                  "relative w-10 h-10 rounded-xl transition-all duration-200",
                  c.tw,
                  accent === c.id
                    ? "ring-2 ring-offset-2 ring-offset-background ring-white/30 scale-110"
                    : "opacity-60 hover:opacity-100 hover:scale-105"
                )}
                title={c.label}
              >
                {accent === c.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white/90" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/50 mt-3">
            Cor atual: <span className="text-foreground font-medium">{ACCENT_COLORS.find((c) => c.id === accent)?.label}</span>
          </p>
        </div>
      </section>

      {/* Font Size */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center gap-2 mb-4">
          <Type className="w-3.5 h-3.5" />
          Tamanho da fonte
        </h4>

        <div className="bg-card/20 border border-white/5 rounded-xl p-4">
          <div className="flex gap-2">
            {FONT_SIZES.map((f) => (
              <button
                key={f.id}
                onClick={() => setFontSize(f.id)}
                className={cn(
                  "flex-1 py-3 rounded-lg border text-center transition-all",
                  fontSize === f.id
                    ? "bg-primary/10 border-primary/25 text-foreground"
                    : "bg-white/5 border-white/5 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("font-medium", f.size)}>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-lg bg-background/50 border border-white/5">
            <p className={cn(
              "text-muted-foreground transition-all",
              fontSize === "small" && "text-xs",
              fontSize === "medium" && "text-sm",
              fontSize === "large" && "text-base"
            )}>
              The quick brown fox jumps over the lazy dog. Esse é um exemplo de como o texto vai aparecer.
            </p>
          </div>
        </div>
      </section>

      {/* Compact mode */}
      <section>
        <div className="bg-card/20 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Modo compacto</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Reduz espaçamentos e tamanhos</p>
            </div>
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={cn(
                "w-11 h-6 rounded-full transition-all duration-200 relative",
                compactMode ? "bg-primary" : "bg-white/10"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200",
                  compactMode ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
