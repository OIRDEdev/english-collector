import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Menu, ArrowLeft, RefreshCw, Youtube, Play } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { youtubeService, TranscriptLine } from "@/services/youtubeService";

// declare global YT types loosely
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Use TranscriptLine from youtubeService
type Caption = TranscriptLine;

export default function VideoPlayer() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  
  const [playbackState, setPlaybackState] = useState<'initial' | 'explanation' | 'with_subs'>('initial');
  const [videoTitle, setVideoTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentCaption, setCurrentCaption] = useState("");
  const reqAnimFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<any>(null);
  const stopTimeRef = useRef<number>(10);

  useEffect(() => {
    // Load YouTube iframe API
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => initializePlayer();
    } else {
      initializePlayer();
    }

    function initializePlayer() {
      playerRef.current = new window.YT.Player("youtube-player", {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          playsinline: 1,
          controls: 0,
          rel: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    }

    return () => {
      // Cleanup player on unmount
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
      if (reqAnimFrameRef.current !== null) cancelAnimationFrame(reqAnimFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [videoId]);

  useEffect(() => {
    async function fetchCaptions() {
      if (!videoId) return;
      try {
        // 2) Tentar buscar a legenda via backend (com JWT para fallback do idioma)
        const transcriptData = await youtubeService.getCaptions(videoId);
        const caps = transcriptData.filter(c => c.start <= 10.5);
        
        let calculatedStopTime = 10;
        if (caps.length > 0) {
          const lastCaption = caps[caps.length - 1];
          const nextCaption = transcriptData[caps.length];
          const lastEnd = lastCaption.start + lastCaption.dur;
          
          if (nextCaption) {
            const gap = nextCaption.start - lastEnd;
            if (gap > 4) {
              calculatedStopTime = lastEnd + 2;
            } else {
              calculatedStopTime = nextCaption.start - 0.001;
            }
          } else {
            calculatedStopTime = lastEnd + 2;
          }
        }
        
        setCaptions(caps);
        stopTimeRef.current = calculatedStopTime;
      } catch (err) {
        console.error("Error fetching captions from backend", err);
      }
    }
    fetchCaptions();
  }, [videoId]);

  function onPlayerReady(event: any) {
    console.log("Player pronto");
    // get metadata if available via yt api
    const data = event.target.getVideoData();
    if (data) {
      setVideoTitle(data.title || "Vídeo");
      setChannelName(data.author || "Canal");
    }
    play10Seconds();
  }

  function onPlayerStateChange(event: any) {
    if (event.data === window.YT.PlayerState.ENDED) {
       setPlaybackState('explanation');
    }
  }

  function play10Seconds() {
    setPlaybackState('initial');
    if (reqAnimFrameRef.current !== null) cancelAnimationFrame(reqAnimFrameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentCaption("");
    
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();

      const monitorTime = () => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const time = playerRef.current.getCurrentTime();
          if (time >= stopTimeRef.current) {
            playerRef.current.pauseVideo();
            setPlaybackState('explanation');
            return;
          }
        }
        reqAnimFrameRef.current = requestAnimationFrame(monitorTime);
      };

      timeoutRef.current = setTimeout(() => {
        reqAnimFrameRef.current = requestAnimationFrame(monitorTime);
      }, 200);
    }
  }

  function playWithSubtitles() {
    setPlaybackState('with_subs');
    if (reqAnimFrameRef.current !== null) cancelAnimationFrame(reqAnimFrameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();

      const syncCaptions = () => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const time = playerRef.current.getCurrentTime();
          
          if (time >= stopTimeRef.current) {
            playerRef.current.pauseVideo();
            setCurrentCaption("");
            setPlaybackState('explanation');
            return;
          }

          const active = captions.find((c, i) => {
            const next = captions[i + 1];
            const end = next ? next.start : c.start + c.dur;
            return time >= c.start && time < end;
          });
          setCurrentCaption(active ? active.text : "");
        }
        reqAnimFrameRef.current = requestAnimationFrame(syncCaptions);
      };

      // wait 200ms for player to start actually playing to prevent drift
      timeoutRef.current = setTimeout(() => {
        reqAnimFrameRef.current = requestAnimationFrame(syncCaptions);
      }, 200);
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-zinc-50 dark:bg-zinc-950">
        <DashboardSidebar
          grupos={[]}
          activeGroup={null}
          onGroupSelect={() => navigate("/dashboard")}
          totalPhrases={0}
        />

        <main className="flex-1 flex flex-col animate-in fade-in duration-500">
          {/* Header */}
          <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4 md:hidden">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <button 
                onClick={() => navigate("/video")}
                className="flex items-center text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </button>
            </div>
            {/* Custom info text requested by user */}
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium px-4 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-700 dark:text-zinc-300">
                Créditos:{" "}
                <a href={`https://youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {videoTitle}
                </a>{" "}
                por {channelName}
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-zinc-900/5 dark:bg-black/20 w-full relative">
            <div className="w-full max-w-5xl aspect-video relative bg-black shadow-2xl rounded-2xl overflow-hidden ring-1 ring-zinc-200/50 dark:ring-white/10 flex items-center justify-center">
              
              {/* YouTube Player Container */}
              <div className="w-full h-full pointer-events-none" id="youtube-player"></div>
              
              {/* Custom YouTube overlay icon requested by user */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 border border-zinc-200/50 dark:border-white/10 pointer-events-auto">
                 <Youtube className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                 <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">YouTube</span>
              </div>

              {/* Subtitles Overlay */}
              {playbackState === 'with_subs' && currentCaption && (
                <div className="absolute bottom-10 left-0 w-full text-center z-10 pointer-events-none px-4">
                  <span className="bg-black/70 text-white px-4 py-2 rounded-lg text-lg md:text-2xl font-semibold backdrop-blur-sm inline-block max-w-3xl">
                    {currentCaption}
                  </span>
                </div>
              )}

              {/* End of 10s Screen / Explanation state */}
              {playbackState === 'explanation' && (
                <div 
                  id="explanation" 
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col p-6 animate-in fade-in"
                >
                  <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full pointer-events-auto mt-12 mb-20">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
                      Explicação Parte a Parte
                    </h3>
                    <div className="bg-zinc-900/60 p-6 md:p-8 rounded-2xl border border-zinc-800 backdrop-blur-md text-center shadow-xl w-full">
                      <p className="text-zinc-300 text-sm sm:text-base md:text-lg leading-relaxed mb-6">
                        "Aqui entra a explicação detalhada do que foi falado neste trecho do vídeo, focada em gramática, vocabulário e expressões usadas."
                      </p>
                      
                      <div className="pt-6 border-t border-zinc-700/50 space-y-3 text-left">
                        <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold block mb-2">Trecho legendado:</span>
                        {captions.map((c, i) => (
                           <p key={i} className="text-zinc-300 italic text-sm sm:text-base leading-relaxed">
                             <span className="text-zinc-600 mr-2 text-xs">{c.start.toFixed(1)}s</span>
                             "{c.text}"
                           </p>
                        ))}
                        {captions.length === 0 && (
                           <p className="text-zinc-500 italic text-sm">Nenhuma legenda encontrada nos primeiros 10s.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Corners Buttons */}
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between pointer-events-none">
                    <button 
                      onClick={play10Seconds}
                      className="pointer-events-auto px-5 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition-colors shadow-lg flex items-center justify-center gap-2 ring-1 ring-zinc-200"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Repetir 10s
                    </button>
                    <button 
                      onClick={playWithSubtitles}
                      className="pointer-events-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" fill="currentColor" />
                      Continuar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
