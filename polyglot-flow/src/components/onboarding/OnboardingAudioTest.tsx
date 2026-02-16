import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff, ArrowRight, Volume2 } from "lucide-react";

interface Props {
  onNext: (data: { audioRecorded: boolean }) => void;
}

export function OnboardingAudioTest({ onNext }: Props) {
  const [phase, setPhase] = useState<"intro" | "recording" | "done">("intro");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>(Array(7).fill(4));
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate bars during recording
  useEffect(() => {
    if (!isRecording) {
      setBarHeights(Array(7).fill(4));
      return;
    }
    let running = true;
    const animate = () => {
      if (!running) return;
      setBarHeights(Array(7).fill(0).map(() => 6 + Math.random() * 30));
      animRef.current = requestAnimationFrame(() => setTimeout(animate, 80));
    };
    animate();
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setPhase("done");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setPhase("recording");
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch {
      console.error("Mic access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const playRecording = () => {
    if (!recordedUrl) return;
    const audio = new Audio(recordedUrl);
    audioRef.current = audio;
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.play();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const PROMPT = "Try to say: \"Hello, my name is... and I'm learning English because I want to improve my skills.\"";

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2">
          <Mic className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          Teste de <span className="text-rose-400">Fala</span>
        </h2>
        <p className="text-sm text-muted-foreground/70">Grave um áudio tentando falar no idioma de aprendizado</p>
      </div>

      {/* Prompt card */}
      <div className="bg-card/20 backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-3">Leia e fale</p>
        <p className="text-base text-foreground/90 leading-relaxed italic">
          "{PROMPT.replace('Try to say: ', '').replace(/"/g, '')}"
        </p>
      </div>

      {/* Recording area */}
      <div className="flex flex-col items-center gap-6">
        {phase === "intro" && (
          <button
            onClick={startRecording}
            className="group relative w-28 h-28 rounded-full bg-gradient-to-br from-rose-500/15 to-pink-500/15 border-2 border-rose-500/25 flex items-center justify-center transition-all hover:scale-110 hover:border-rose-400/40 hover:shadow-[0_0_60px_rgba(244,63,94,0.15)]"
          >
            <Mic className="w-12 h-12 text-rose-400 group-hover:text-rose-300 transition-colors" />
            <div className="absolute inset-0 rounded-full border-2 border-rose-500/15 animate-ping" style={{ animationDuration: "2s" }} />
          </button>
        )}

        {phase === "recording" && (
          <div className="flex flex-col items-center gap-5">
            {/* Bars */}
            <div className="flex items-center gap-[5px] h-12">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className="w-[5px] rounded-full bg-rose-400/70 transition-all duration-100"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-rose-400/70">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Gravando • {formatTime(seconds)}
            </div>

            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 hover:bg-rose-500/30 hover:scale-110 transition-all active:scale-95"
            >
              <MicOff className="w-9 h-9" />
            </button>
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">Toque para parar</p>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-90 duration-500">
            <div className="text-4xl">🎉</div>
            <p className="text-lg font-bold text-foreground">Áudio gravado!</p>

            {/* Playback */}
            <button
              onClick={playRecording}
              className={cn(
                "px-6 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all",
                isPlaying
                  ? "bg-rose-500/15 border-rose-500/25 text-rose-400"
                  : "bg-white/5 border-white/10 text-foreground hover:bg-white/10"
              )}
            >
              <Volume2 className={cn("w-4 h-4", isPlaying && "animate-pulse")} />
              {isPlaying ? "Reproduzindo..." : "Ouvir gravação"}
            </button>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setRecordedUrl(null);
                  setPhase("intro");
                  setSeconds(0);
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 text-muted-foreground text-sm font-medium hover:bg-white/10 transition-all"
              >
                Regravar
              </button>
              <button
                onClick={() => onNext({ audioRecorded: true })}
                className="flex-1 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm font-bold hover:bg-rose-500/30 transition-all flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {phase === "intro" && (
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground/40 uppercase tracking-widest">
              Toque para gravar
            </p>
            <button
              onClick={() => onNext({ audioRecorded: false })}
              className="text-xs text-muted-foreground/30 hover:text-muted-foreground/50 underline transition-all"
            >
              Pular este passo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
