import { useState, useRef, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  Menu,
  Play,
  Pause,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  MessageCircle,
  User,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Mock Data ─────────────────────────────────────────────────
const MOCK_CONVERSATION = {
  title: "Ordering at a Restaurant",
  level: "Intermediate",
  context: "You're at a restaurant in London. Practice ordering food and asking questions to the waiter.",
  messages: [
    {
      id: 1,
      role: "ai" as const,
      text: "Good evening! Welcome to The Golden Fork. My name is James, and I'll be your server tonight. Can I start you off with something to drink?",
      audioSrc: "/teste.mp3",
    },
    {
      id: 2,
      role: "user" as const,
      text: "", // User will record
      audioSrc: null,
    },
    {
      id: 3,
      role: "ai" as const,
      text: "Excellent choice! And are you ready to order, or would you like a few more minutes with the menu?",
      audioSrc: "/teste.mp3",
    },
    {
      id: 4,
      role: "user" as const,
      text: "",
      audioSrc: null,
    },
    {
      id: 5,
      role: "ai" as const,
      text: "The grilled salmon is one of our most popular dishes. It comes with roasted vegetables and a lemon butter sauce. Would you like to try that?",
      audioSrc: "/teste.mp3",
    },
  ],
};

interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  audioSrc: string | null;
}

// ─── Audio Visualizer ──────────────────────────────────────────
function AudioVisualizer({ isActive, color }: { isActive: boolean; color: string }) {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-all",
            isActive ? "animate-pulse" : "h-1"
          )}
          style={{
            backgroundColor: color,
            height: isActive ? `${12 + Math.random() * 20}px` : "4px",
            animationDelay: `${i * 120}ms`,
            animationDuration: `${600 + Math.random() * 400}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Waveform Bars (animated) ──────────────────────────────────
function WaveformBars({ playing }: { playing: boolean }) {
  const bars = 24;
  return (
    <div className="flex items-end gap-[2px] h-10 px-1">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = Math.sin((i / bars) * Math.PI) * 100;
        return (
          <div
            key={i}
            className={cn(
              "w-[2px] rounded-full transition-all duration-300",
              playing
                ? "bg-emerald-400/80"
                : "bg-white/10"
            )}
            style={{
              height: playing
                ? `${Math.max(4, baseHeight * (0.3 + Math.random() * 0.7))}%`
                : `${Math.max(8, baseHeight * 0.3)}%`,
              transitionDelay: `${i * 20}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
const Conversation = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState<Map<number, Blob>>(new Map());
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [waitingForUser, setWaitingForUser] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(5).fill(4));

  const messages = MOCK_CONVERSATION.messages;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, waitingForUser]);

  // Animate visualizer bars when recording
  useEffect(() => {
    if (!isRecording) {
      setBarHeights(Array(5).fill(4));
      return;
    }
    let running = true;
    const animate = () => {
      if (!running) return;
      setBarHeights(Array(5).fill(0).map(() => 6 + Math.random() * 26));
      animFrameRef.current = requestAnimationFrame(() => {
        setTimeout(animate, 100);
      });
    };
    animate();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRecording]);

  const playAudio = useCallback((src: string) => {
    return new Promise<void>((resolve) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(src);
      audioRef.current = audio;
      setIsPlayingAudio(true);

      audio.onended = () => {
        setIsPlayingAudio(false);
        resolve();
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        resolve();
      };
      audio.play().catch(() => {
        setIsPlayingAudio(false);
        resolve();
      });
    });
  }, []);

  const advanceConversation = useCallback(async () => {
    if (currentStep >= messages.length) return;

    const msg = messages[currentStep];

    if (msg.role === "ai") {
      // Add AI message with typing effect
      setVisibleMessages((prev) => [...prev, msg]);

      // Play audio if available
      if (msg.audioSrc) {
        await playAudio(msg.audioSrc);
      }

      // Check if next is user turn
      const nextStep = currentStep + 1;
      if (nextStep < messages.length && messages[nextStep].role === "user") {
        setCurrentStep(nextStep);
        setWaitingForUser(true);
      } else {
        setCurrentStep(nextStep);
        // Auto-advance to next AI message after brief pause
        if (nextStep < messages.length) {
          setTimeout(() => advanceConversation(), 800);
        }
      }
    }
  }, [currentStep, messages, playAudio]);

  const handleStart = useCallback(async () => {
    setHasStarted(true);
    // Start playing first AI message after brief delay
    setTimeout(() => advanceConversation(), 600);
  }, [advanceConversation]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlobs((prev) => new Map(prev).set(currentStep, blob));

        // Add user message
        const userMsg = messages[currentStep];
        setVisibleMessages((prev) => [
          ...prev,
          { ...userMsg, text: "🎙️ Resposta gravada" },
        ]);
        setWaitingForUser(false);

        // Move to next step
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);

        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());

        // Continue conversation after brief pause
        if (nextStep < messages.length) {
          setTimeout(() => {
            // Need to trigger advance manually since currentStep won't be updated in closure
            const nextMsg = messages[nextStep];
            if (nextMsg.role === "ai") {
              setVisibleMessages((prev) => [...prev, nextMsg]);
              if (nextMsg.audioSrc) {
                playAudio(nextMsg.audioSrc).then(() => {
                  const afterNext = nextStep + 1;
                  if (afterNext < messages.length && messages[afterNext].role === "user") {
                    setCurrentStep(afterNext);
                    setWaitingForUser(true);
                  } else {
                    setCurrentStep(afterNext);
                  }
                });
              }
            }
          }, 800);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [currentStep, messages, playAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    setHasStarted(false);
    setCurrentStep(0);
    setVisibleMessages([]);
    setWaitingForUser(false);
    setIsPlayingAudio(false);
    setIsRecording(false);
    setRecordedBlobs(new Map());
  }, []);

  const isConversationDone = currentStep >= messages.length && !waitingForUser;

  // ─── Landing / Start Screen ──────────────────────────────────
  if (!hasStarted) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar grupos={[]} activeGroup={null} onGroupSelect={() => {}} totalPhrases={0} />

          <main className="flex-1 flex items-center justify-center relative overflow-hidden">
            {/* Ambient background */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-500/3 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-10 max-w-md text-center px-6">
              {/* Logo */}
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center backdrop-blur-sm">
                  <MessageCircle className="w-9 h-9 text-emerald-400" />
                </div>
                <h1 className="text-4xl font-bold font-mono italic tracking-tighter">
                  <span className="text-foreground">CONVER</span>
                  <span className="text-emerald-400">SATION</span>
                </h1>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.3em]">
                  Immersive Speaking Practice
                </p>
              </div>

              {/* Context card */}
              <div className="w-full bg-card/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">{MOCK_CONVERSATION.level}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {MOCK_CONVERSATION.messages.filter(m => m.role === "ai").length} exchanges
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-foreground">{MOCK_CONVERSATION.title}</h2>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{MOCK_CONVERSATION.context}</p>
              </div>

              {/* Play Button */}
              <button
                onClick={handleStart}
                className="group relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/30 flex items-center justify-center transition-all duration-500 hover:scale-110 hover:border-emerald-400/50 hover:shadow-[0_0_60px_rgba(16,185,129,0.2)] active:scale-95"
              >
                <Play className="w-10 h-10 text-emerald-400 ml-1 group-hover:text-emerald-300 transition-colors" />

                {/* Pulse rings */}
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-[-8px] rounded-full border border-emerald-500/10 animate-ping" style={{ animationDuration: "3s" }} />
              </button>

              <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">
                Toque para iniciar
              </p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // ─── Active Conversation ─────────────────────────────────────
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar grupos={[]} activeGroup={null} onGroupSelect={() => {}} totalPhrases={0} />

        <main className="flex-1 flex flex-col relative">
          {/* Header */}
          <header className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <div>
                <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  {MOCK_CONVERSATION.title}
                </h1>
                <p className="text-xs text-muted-foreground">{MOCK_CONVERSATION.level}</p>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-auto px-6 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
              {visibleMessages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1",
                    msg.role === "ai"
                      ? "bg-emerald-500/15 border border-emerald-500/20"
                      : "bg-cyan-500/15 border border-cyan-500/20"
                  )}>
                    {msg.role === "ai"
                      ? <Bot className="w-4 h-4 text-emerald-400" />
                      : <User className="w-4 h-4 text-cyan-400" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed",
                    msg.role === "ai"
                      ? "bg-card/30 backdrop-blur-md border border-white/5 text-foreground/90 rounded-tl-md"
                      : "bg-cyan-500/10 border border-cyan-500/15 text-cyan-100 rounded-tr-md"
                  )}>
                    <p>{msg.text}</p>

                    {/* Audio waveform for AI messages */}
                    {msg.role === "ai" && msg.audioSrc && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => playAudio(msg.audioSrc!)}
                            className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-all"
                          >
                            {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          </button>
                          <WaveformBars playing={isPlayingAudio} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Waiting for user indicator */}
              {waitingForUser && !isRecording && (
                <div className="flex justify-center py-6 animate-in fade-in duration-500">
                  <button
                    onClick={startRecording}
                    className="group flex flex-col items-center gap-3"
                  >
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]">
                      <Mic className="w-8 h-8 text-cyan-400" />
                      {/* Pulse */}
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" style={{ animationDuration: "2s" }} />
                    </div>
                    <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">
                      Toque para gravar
                    </span>
                  </button>
                </div>
              )}

              {/* Recording indicator */}
              {isRecording && (
                <div className="flex justify-center py-6 animate-in fade-in zoom-in-90 duration-300">
                  <div className="flex flex-col items-center gap-4">
                    {/* Animated bars */}
                    <div className="flex items-center gap-[4px] h-10">
                      {barHeights.map((h, i) => (
                        <div
                          key={i}
                          className="w-[4px] rounded-full bg-red-400/80 transition-all duration-150"
                          style={{ height: `${h}px` }}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-red-400/80 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Gravando...
                    </p>

                    <button
                      onClick={stopRecording}
                      className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/30 hover:scale-110 transition-all active:scale-95"
                    >
                      <MicOff className="w-7 h-7" />
                    </button>

                    <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
                      Toque para parar
                    </span>
                  </div>
                </div>
              )}

              {/* Conversation complete */}
              {isConversationDone && (
                <div className="flex justify-center py-10 animate-in fade-in zoom-in-90 duration-700">
                  <div className="text-center space-y-4">
                    <div className="text-5xl">🎉</div>
                    <h3 className="text-xl font-bold text-foreground">Conversa completa!</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Você praticou {recordedBlobs.size} respostas nessa conversa.
                    </p>
                    <button
                      onClick={handleRestart}
                      className="mt-4 px-6 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all"
                    >
                      <RotateCcw className="w-4 h-4 inline-block mr-2" />
                      Praticar novamente
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="h-14 border-t border-border/50 flex items-center justify-center gap-4 px-6 bg-background/80 backdrop-blur-sm">
            {isPlayingAudio && (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <AudioVisualizer isActive color="rgb(52, 211, 153)" />
                <span className="uppercase tracking-wider">Playing audio...</span>
              </div>
            )}
            {isRecording && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="uppercase tracking-wider">Recording...</span>
              </div>
            )}
            {!isPlayingAudio && !isRecording && waitingForUser && (
              <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">Your turn to speak</p>
            )}
            {!isPlayingAudio && !isRecording && !waitingForUser && !isConversationDone && visibleMessages.length > 0 && (
              <p className="text-xs text-muted-foreground/30 uppercase tracking-wider">Listening...</p>
            )}
            {isConversationDone && (
              <p className="text-xs text-emerald-400/60 uppercase tracking-wider">Session complete</p>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Conversation;
