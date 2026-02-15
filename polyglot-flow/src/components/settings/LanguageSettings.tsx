import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Globe } from "lucide-react";

const LANGUAGES = [
  { code: "pt-br", name: "Português (Brasil)", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
];

const LEVELS = [
  { id: "beginner", label: "Iniciante", description: "Vocabulário básico e frases simples" },
  { id: "intermediate", label: "Intermediário", description: "Conversação e gramática" },
  { id: "advanced", label: "Avançado", description: "Fluência e nuances" },
];

export function LanguageSettings() {
  const [nativeLang, setNativeLang] = useState("pt-br");
  const [targetLang, setTargetLang] = useState("en");
  const [level, setLevel] = useState("intermediate");

  return (
    <div className="space-y-8">
      {/* Native Language */}
      <section className="space-y-1">
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center gap-2 mb-4">
          <Globe className="w-3.5 h-3.5" />
          Idioma nativo
        </h4>

        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setNativeLang(lang.code)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all",
                nativeLang === lang.code
                  ? "bg-primary/10 border-primary/25 text-foreground"
                  : "bg-card/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="font-medium truncate">{lang.name}</span>
              {nativeLang === lang.code && (
                <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Target Language */}
      <section className="space-y-1">
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center gap-2 mb-4">
          <Globe className="w-3.5 h-3.5" />
          Idioma alvo
        </h4>

        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.filter((l) => l.code !== nativeLang).map((lang) => (
            <button
              key={lang.code}
              onClick={() => setTargetLang(lang.code)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all",
                targetLang === lang.code
                  ? "bg-emerald-500/10 border-emerald-500/25 text-foreground"
                  : "bg-card/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="font-medium truncate">{lang.name}</span>
              {targetLang === lang.code && (
                <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Level */}
      <section className="space-y-1">
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold mb-4">
          Nível de proficiência
        </h4>

        <div className="space-y-2">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setLevel(lvl.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all",
                level === lvl.id
                  ? "bg-primary/10 border-primary/25"
                  : "bg-card/20 border-white/5 hover:bg-white/5"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  level === lvl.id ? "border-primary bg-primary" : "border-white/20"
                )}
              >
                {level === lvl.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{lvl.label}</p>
                <p className="text-xs text-muted-foreground/60">{lvl.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
