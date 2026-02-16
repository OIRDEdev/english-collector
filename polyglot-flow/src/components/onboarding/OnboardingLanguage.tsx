import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ArrowRight } from "lucide-react";

const LANGUAGES = [
  { code: "pt-br", name: "Português", flag: "🇧🇷", region: "Brasil" },
  { code: "en", name: "English", flag: "🇺🇸", region: "United States" },
  { code: "es", name: "Español", flag: "🇪🇸", region: "España" },
  { code: "fr", name: "Français", flag: "🇫🇷", region: "France" },
  { code: "de", name: "Deutsch", flag: "🇩🇪", region: "Deutschland" },
  { code: "it", name: "Italiano", flag: "🇮🇹", region: "Italia" },
  { code: "ja", name: "日本語", flag: "🇯🇵", region: "Japan" },
  { code: "ko", name: "한국어", flag: "🇰🇷", region: "Korea" },
];

interface Props {
  onNext: (data: { nativeLang: string; targetLang: string }) => void;
}

export function OnboardingLanguage({ onNext }: Props) {
  const [step, setStep] = useState<"native" | "target">("native");
  const [nativeLang, setNativeLang] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string | null>(null);

  const handleSelectNative = (code: string) => {
    setNativeLang(code);
  };

  const handleSelectTarget = (code: string) => {
    setTargetLang(code);
  };

  const availableTargets = LANGUAGES.filter((l) => l.code !== nativeLang);

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      {step === "native" ? (
        <>
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em]">Passo 1 de 2</p>
            <h2 className="text-3xl font-bold text-foreground">
              Qual é o seu <span className="text-primary">idioma nativo</span>?
            </h2>
            <p className="text-sm text-muted-foreground/70">Selecione o idioma que você fala naturalmente</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((lang, i) => (
              <button
                key={lang.code}
                onClick={() => handleSelectNative(lang.code)}
                className={cn(
                  "flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all duration-300",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  nativeLang === lang.code
                    ? "bg-primary/10 border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.1)]"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className={cn("text-sm font-semibold", nativeLang === lang.code ? "text-foreground" : "text-foreground/80")}>
                    {lang.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">{lang.region}</p>
                </div>
                {nativeLang === lang.code && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => nativeLang && setStep("target")}
            disabled={!nativeLang}
            className={cn(
              "w-full py-4 rounded-xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2",
              nativeLang
                ? "bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 hover:scale-[1.01]"
                : "bg-white/5 border border-white/5 text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em]">Passo 2 de 2</p>
            <h2 className="text-3xl font-bold text-foreground">
              Qual idioma quer <span className="text-emerald-400">aprender</span>?
            </h2>
            <p className="text-sm text-muted-foreground/70">Escolha o idioma que deseja dominar</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {availableTargets.map((lang, i) => (
              <button
                key={lang.code}
                onClick={() => handleSelectTarget(lang.code)}
                className={cn(
                  "flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all duration-300",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  targetLang === lang.code
                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className={cn("text-sm font-semibold", targetLang === lang.code ? "text-foreground" : "text-foreground/80")}>
                    {lang.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">{lang.region}</p>
                </div>
                {targetLang === lang.code && (
                  <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("native")}
              className="px-6 py-4 rounded-xl bg-white/5 border border-white/5 text-muted-foreground text-sm font-medium hover:bg-white/10 transition-all"
            >
              Voltar
            </button>
            <button
              onClick={() => nativeLang && targetLang && onNext({ nativeLang, targetLang })}
              disabled={!targetLang}
              className={cn(
                "flex-1 py-4 rounded-xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2",
                targetLang
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 hover:scale-[1.01]"
                  : "bg-white/5 border border-white/5 text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
