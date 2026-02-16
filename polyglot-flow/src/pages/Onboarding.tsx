import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import gsap from "gsap";

import { OnboardingLanguage } from "@/components/onboarding/OnboardingLanguage";
import { OnboardingTime } from "@/components/onboarding/OnboardingTime";
import { OnboardingWritingTest } from "@/components/onboarding/OnboardingWritingTest";
import { OnboardingAudioTest } from "@/components/onboarding/OnboardingAudioTest";
import { OnboardingCards } from "@/components/onboarding/OnboardingCards";
import { OnboardingPlans } from "@/components/onboarding/OnboardingPlans";

const PHASE_LABELS = [
  "Idiomas",
  "Tempo",
  "Escrita",
  "Fala",
  "Cards",
  "Plano",
];

const PHASE_COLORS = [
  { from: "rgba(139, 92, 246, 0.06)", to: "rgba(16, 185, 129, 0.04)" },   // violet → emerald
  { from: "rgba(6, 182, 212, 0.06)", to: "rgba(59, 130, 246, 0.04)" },     // cyan → blue
  { from: "rgba(245, 158, 11, 0.06)", to: "rgba(249, 115, 22, 0.04)" },    // amber → orange
  { from: "rgba(244, 63, 94, 0.06)", to: "rgba(236, 72, 153, 0.04)" },     // rose → pink
  { from: "rgba(139, 92, 246, 0.06)", to: "rgba(99, 102, 241, 0.04)" },    // violet → indigo
  { from: "rgba(139, 92, 246, 0.08)", to: "rgba(168, 85, 247, 0.05)" },    // primary
];

interface OnboardingData {
  nativeLang?: string;
  targetLang?: string;
  dailyMinutes?: string;
  writingScore?: number;
  audioRecorded?: boolean;
  dailyCards?: string;
  plan?: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);
  const [data, setData] = useState<OnboardingData>({});

  const bgRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const totalPhases = PHASE_LABELS.length;

  // GSAP background orbs animation
  useEffect(() => {
    const orbs = [orb1Ref.current, orb2Ref.current, orb3Ref.current];
    if (!orbs.every(Boolean)) return;

    // Continuous floating movement
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        x: `random(-120, 120)`,
        y: `random(-80, 80)`,
        duration: 8 + i * 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 1.5,
      });

      gsap.to(orb, {
        scale: `random(0.8, 1.3)`,
        duration: 6 + i * 2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i,
      });
    });

    return () => {
      orbs.forEach((orb) => orb && gsap.killTweensOf(orb));
    };
  }, []);

  // Transition orb colors on phase change
  useEffect(() => {
    const colors = PHASE_COLORS[phase] || PHASE_COLORS[0];
    const orbs = [orb1Ref.current, orb2Ref.current, orb3Ref.current];

    orbs.forEach((orb, i) => {
      if (!orb) return;
      gsap.to(orb, {
        background: `radial-gradient(circle, ${i % 2 === 0 ? colors.from : colors.to} 0%, transparent 70%)`,
        duration: 1.2,
        ease: "power2.out",
      });
    });
  }, [phase]);

  // Content enter animation on phase change
  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
    );
  }, [phase]);

  const goNext = useCallback(
    (phaseData: Partial<OnboardingData>) => {
      const newData = { ...data, ...phaseData };
      setData(newData);

      // Animate out
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          opacity: 0,
          y: -30,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            if (phase < totalPhases - 1) {
              setPhase((p) => p + 1);
            } else {
              // Done — output JSON
              const finalConfig = { ...newData };
              console.log("🎉 Onboarding config:", JSON.stringify(finalConfig, null, 2));

              // Show alert with config then navigate
              const msg = `Configuração salva!\n\n${JSON.stringify(finalConfig, null, 2)}`;
              alert(msg);
              navigate("/dashboard");
            }
          },
        });
      } else {
        if (phase < totalPhases - 1) {
          setPhase((p) => p + 1);
        }
      }
    },
    [data, phase, totalPhases, navigate]
  );

  const renderPhase = () => {
    switch (phase) {
      case 0:
        return <OnboardingLanguage onNext={(d) => goNext(d)} />;
      case 1:
        return <OnboardingTime onNext={(d) => goNext(d)} />;
      case 2:
        return <OnboardingWritingTest onNext={(d) => goNext(d)} />;
      case 3:
        return <OnboardingAudioTest onNext={(d) => goNext(d)} />;
      case 4:
        return <OnboardingCards onNext={(d) => goNext(d)} />;
      case 5:
        return <OnboardingPlans onNext={(d) => goNext(d)} />;
      default:
        return null;
    }
  };

  const progress = ((phase + 1) / totalPhases) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* GSAP animated background orbs */}
      <div ref={bgRef} className="fixed inset-0 pointer-events-none z-0">
        <div
          ref={orb1Ref}
          className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full will-change-transform"
          style={{
            background: `radial-gradient(circle, ${PHASE_COLORS[phase].from} 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
        <div
          ref={orb2Ref}
          className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full will-change-transform"
          style={{
            background: `radial-gradient(circle, ${PHASE_COLORS[phase].to} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
        <div
          ref={orb3Ref}
          className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full will-change-transform"
          style={{
            background: `radial-gradient(circle, ${PHASE_COLORS[phase].from} 0%, transparent 70%)`,
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold font-mono italic tracking-tighter text-foreground">
            Polyglot<span className="text-primary">Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground/50 uppercase tracking-widest">
            {PHASE_LABELS[phase]}
          </span>
          <span className="text-xs text-muted-foreground/30">
            {phase + 1}/{totalPhases}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 px-6">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phase dots */}
        <div className="flex items-center justify-between mt-3 px-1">
          {PHASE_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-500",
                  i < phase
                    ? "bg-primary scale-100"
                    : i === phase
                      ? "bg-primary scale-125 shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                      : "bg-white/10"
                )}
              />
              <span
                className={cn(
                  "text-[9px] tracking-wider transition-all hidden md:block",
                  i <= phase ? "text-muted-foreground/60" : "text-muted-foreground/20"
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-6 py-8">
        <div ref={contentRef} className="w-full">
          {renderPhase()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
