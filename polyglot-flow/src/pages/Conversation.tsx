import { useState, useRef, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  Menu, Play, Pause, Mic, MicOff, Volume2, RotateCcw, MessageCircle, User, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
              playing ? "bg-emerald-400/80" : "bg-white/10"
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

const Conversation = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [waitingForUser, setWaitingForUser] = useState(true);

  // WebSocket and Audio Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio Playback Refs (Blob-queue pattern for cross-browser support)
  const audioChunkBuffer = useRef<Uint8Array[]>([]); // Accumulate chunks per phrase
  const audioPlayQueue = useRef<string[]>([]);       // Queue of complete Blob URLs
  const isPlayingQueueRef = useRef(false);

  // Anim Refs
  const animFrameRef = useRef<number>(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(5).fill(4));

  // Websocket Initialization
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" ? "localhost:8080" : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/conversation`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[Conversation] WebSocket Connected");
      ws.send(JSON.stringify({
        type: "setup",
        language_id: 1, 
        voice_id: "21m00Tcm4TlvDq8ikWAM"
      }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // 1. Text Events (Progressive chunk streaming from the LLM)
        if (payload.type === "text" && payload.text) {
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === "ai") {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...lastMsg,
                text: lastMsg.text + payload.text,
              };
              return updated;
            } else {
              return [
                ...prev,
                { id: Date.now(), role: "ai", text: payload.text, audioSrc: null },
              ];
            }
          });
        }

        // 2. Audio Events (Base64 MP3 chunks from TTS — accumulate per phrase)
        if (payload.type === "audio" && payload.audio) {
          const binaryStr = atob(payload.audio);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          audioChunkBuffer.current.push(bytes);
        }

        // 3. TTS End Event — phrase audio is complete, create Blob and enqueue
        if (payload.type === "tts_end") {
          setTimeout(() => {
            if (audioChunkBuffer.current.length > 0) {
              const blob = new Blob(
                audioChunkBuffer.current.map(u8 => new Uint8Array(u8).buffer),
                { type: "audio/mpeg" }
              );

              const blobUrl = URL.createObjectURL(blob);

              audioPlayQueue.current.push(blobUrl);

              audioChunkBuffer.current = [];

              playNextInQueue();
            }
          }, 50); // pequeno atraso
        }

        // 4. STT Events (Transcribed text from user audio)
        if (payload.type === "stt" && payload.text) {
          setMessages((prev) => {
             const lastMsg = prev[prev.length - 1];
             if (lastMsg && lastMsg.role === "user" && lastMsg.text === "🎙️ Processando transcrição...") {
                 const updated = [...prev];
                 updated[updated.length - 1] = { ...lastMsg, text: payload.text };
                 return updated;
             }
             return prev;
          });
        }
      } catch (err) {
        console.error("WS Parse Error", err);
      }
    };

    ws.onclose = () => console.log("[Conversation] WebSocket Disconnected");
  }, []);

  // ─── Blob Queue Player (cross-browser) ──────────────────────────
  const playNextInQueue = async () => {
    if (isPlayingQueueRef.current) return; // Already playing
    if (audioPlayQueue.current.length === 0) return;

    isPlayingQueueRef.current = true;
    setIsPlayingAudio(true);
    setWaitingForUser(false);

    try {
      while (audioPlayQueue.current.length > 0) {
        const blobUrl = audioPlayQueue.current.shift();
        if (!blobUrl) continue;

        await new Promise<void>((resolve) => {
          const audio = new Audio(blobUrl);
          audio.onended = () => {
            URL.revokeObjectURL(blobUrl);
            resolve();
          };
          audio.onerror = () => {
            console.warn("[AudioPlayer] Erro ao reproduzir frase TTS, pulando...");
            URL.revokeObjectURL(blobUrl);
            resolve();
          };
          audio.play().catch((e) => {
            console.warn("[AudioPlayer] Autoplay bloqueado:", e);
            URL.revokeObjectURL(blobUrl);
            resolve();
          });
        });
      }
    } catch (e) {
      console.error("[AudioPlayer] Erro inesperado na fila:", e);
    }

    setIsPlayingAudio(false);
    isPlayingQueueRef.current = false;
    setWaitingForUser(true);
  };

  // Recording Mechanics directly to 16kHz PCM
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int16Array PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert Int16Array to Base64 String
        const buffer = new Uint8Array(pcm16.buffer);
        let binary = '';
        const len = buffer.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        const b64 = window.btoa(binary);

        // Dispatch directly into WebSocket Audio Payload
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "audio",
            audio: b64,
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (processorRef.current) {
        processorRef.current.disconnect();
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
    }
    
    // Explicitly emit end of stream for accurate Commits on STT Engine
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "audio_end" }));
    }

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: "🎙️ Processando transcrição...", audioSrc: null },
    ]);
    setIsRecording(false);
    setWaitingForUser(false);
  };

  const toggleRecording = () => {
     if (isRecording) {
         stopRecording();
     } else {
         startRecording();
     }
  };

  const handleStart = () => {
    setHasStarted(true);
    setWaitingForUser(true);
    connectWebSocket();
    setMessages([
      {
        id: Date.now(),
        role: "ai",
        text: "Bem vindo a sala de conversação nativa! Segure o microfone abaixo para começar a falar.",
        audioSrc: null,
      }
    ]);
  };

  const handleRestart = () => {
    if (wsRef.current) wsRef.current.close();
    audioChunkBuffer.current = [];
    audioPlayQueue.current.forEach(url => URL.revokeObjectURL(url));
    audioPlayQueue.current = [];
    isPlayingQueueRef.current = false;
    setHasStarted(false);
    setMessages([]);
    setWaitingForUser(true);
    setIsPlayingAudio(false);
    setIsRecording(false);
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, waitingForUser, isRecording]);

  // Visualizer Animation
  useEffect(() => {
    if (!isRecording) {
      setBarHeights(Array(5).fill(4));
      return;
    }
    let running = true;
    const animate = () => {
      if (!running) return;
      setBarHeights(Array(5).fill(0).map(() => 6 + Math.random() * 26));
      animFrameRef.current = requestAnimationFrame(() => setTimeout(animate, 100));
    };
    animate();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [isRecording]);

  // Cleanups
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (processorRef.current) processorRef.current.disconnect();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close().catch(console.error);
      audioPlayQueue.current.forEach(url => URL.revokeObjectURL(url));
      audioPlayQueue.current = [];
    };
  }, []);

  // ─── Landing / Start Screen ──────────────────────────────────
  if (!hasStarted) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar grupos={[]} activeGroup={null} onGroupSelect={() => {}} totalPhrases={0} />
          <main className="flex-1 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-500/3 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-10 max-w-md text-center px-6">
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center backdrop-blur-sm">
                  <MessageCircle className="w-9 h-9 text-emerald-400" />
                </div>
                <h1 className="text-4xl font-bold font-mono italic tracking-tighter">
                  <span className="text-foreground">CONVER</span>
                  <span className="text-emerald-400">SATION</span>
                </h1>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.3em]">
                  Real-time English Practice
                </p>
              </div>

              <div className="w-full bg-card/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Ao vivo</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Scribe v2
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-foreground">Fluência Diária</h2>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">Pratique sua pronúncia e audição em tempo real com seu tutor virtual nativo.</p>
              </div>

              <button
                onClick={handleStart}
                className="group relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/30 flex items-center justify-center transition-all duration-500 hover:scale-110 hover:border-emerald-400/50 hover:shadow-[0_0_60px_rgba(16,185,129,0.2)] active:scale-95"
              >
                <Play className="w-10 h-10 text-emerald-400 ml-1 group-hover:text-emerald-300 transition-colors" />
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-[-8px] rounded-full border border-emerald-500/10 animate-ping" style={{ animationDuration: "3s" }} />
              </button>
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

        <main className="flex-1 flex flex-col relative max-h-screen">
          <header className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden"><Menu className="h-5 w-5" /></SidebarTrigger>
              <div>
                <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" /> English Practice
                </h1>
                <p className="text-xs text-muted-foreground">Live Streaming</p>
              </div>
            </div>
            <button onClick={handleRestart} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
              <RotateCcw className="w-4 h-4" />
            </button>
          </header>

          <div className="flex-1 overflow-auto px-6 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <div key={msg.id} className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1", msg.role === "ai" ? "bg-emerald-500/15 border border-emerald-500/20" : "bg-cyan-500/15 border border-cyan-500/20")}>
                    {msg.role === "ai" ? <Bot className="w-4 h-4 text-emerald-400" /> : <User className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className={cn("max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed", msg.role === "ai" ? "bg-card/30 backdrop-blur-md border border-white/5 text-foreground/90 rounded-tl-md" : "bg-cyan-500/10 border border-cyan-500/15 text-cyan-100 rounded-tr-md")}>
                    <p>{msg.text}</p>
                    {msg.role === "ai" && isPlayingAudio && i === messages.length - 1 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-3">
                           <WaveformBars playing={true} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* User Bubble Displaying While Recording */}
              {isRecording && (
                <div className="flex gap-3 flex-row-reverse animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 bg-cyan-500/15 border border-cyan-500/20">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed bg-cyan-500/10 border border-cyan-500/15 text-cyan-100 rounded-tr-md flex flex-col gap-3 min-w-[140px]">
                    <div className="flex items-center gap-3 justify-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-400/80 font-medium tracking-wide">Gravando...</span>
                    </div>
                    <div className="flex items-center gap-[4px] h-8 justify-center">
                      {barHeights.map((h, i) => (
                        <div key={i} className="w-[4px] rounded-full bg-red-400/80 transition-all duration-150" style={{ height: `${Math.max(4, h * 0.7)}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Processing Bubble */}
              {!isRecording && !waitingForUser && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                <div className="flex gap-3 flex-row animate-in fade-in slide-in-from-bottom-3 duration-500 opacity-60">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 bg-emerald-500/15 border border-emerald-500/20">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed bg-card/30 backdrop-blur-md border border-white/5 text-foreground/90 rounded-tl-md">
                     <div className="flex items-center gap-2 py-1 px-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                     </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
              <div className="h-6"></div> {/* Bottom Padding Spacer */}
            </div>
          </div>

          <div className="p-4 border-t border-border/50 bg-background/95 backdrop-blur-xl sticky bottom-0 z-20 flex-shrink-0">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
               {/* Left Context Side */}
               <div className="flex-1 flex items-center gap-3 h-14">
                  {isPlayingAudio && (
                     <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 shadow-sm animate-in zoom-in-95">
                        <AudioVisualizer isActive color="rgb(52, 211, 153)" />
                        <span className="uppercase tracking-wider font-medium ml-1">IA Falando...</span>
                     </div>
                  )}
                  {!isPlayingAudio && !isRecording && waitingForUser && (
                     <p className="text-sm text-muted-foreground/50 font-medium ml-2 uppercase tracking-widest animate-in fade-in">
                        Sua vez de falar
                     </p>
                  )}
                  {!isPlayingAudio && !isRecording && !waitingForUser && messages.length > 0 && (
                     <div className="flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 animate-in fade-in">
                       <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                       <span className="uppercase tracking-wider font-medium ml-1">Processando contexto...</span>
                     </div>
                  )}
               </div>

               {/* Right Action Button Side */}
               <div className="flex-shrink-0 flex items-center justify-center w-16">
                  {waitingForUser && !isRecording && (
                    <button onClick={toggleRecording} className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center transition-all hover:scale-105 group relative active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                      <Mic className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300" />
                    </button>
                  )}
                  {isRecording && (
                    <button onClick={toggleRecording} className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center transition-all hover:bg-red-500/30 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.2)] group relative">
                      <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping" />
                      <MicOff className="w-6 h-6 text-red-400 group-hover:text-red-300" />
                    </button>
                  )}
               </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Conversation;
