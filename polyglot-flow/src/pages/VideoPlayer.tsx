import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Youtube, Play } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { youtubeService, TranslationSegment } from "@/services/youtubeService";
import { TranscriptPanel } from "@/components/video/TranscriptPanel";
import { MobileBottomBar } from "@/components/video/MobileBottomBar";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// type Caption = TranslationSegment; // Removed old type alias

export default function VideoPlayer() {
  const { videoId } = useParams<{ videoId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);

  const timeStart = searchParams.get('t') ? Number(searchParams.get('t')) : 0;
  const timeEnd = searchParams.get('end') ? Number(searchParams.get('end')) : undefined;
  
  const [playbackState, setPlaybackState] = useState<'initial' | 'explanation' | 'with_subs'>('initial');
  const [videoTitle, setVideoTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  
  const [captions, setCaptions] = useState<TranslationSegment[]>([]);
  const [currentCaption, setCurrentCaption] = useState("");
  const reqAnimFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<any>(null);
  const stopTimeRef = useRef<number>(10);

  useEffect(() => {
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
      stopTimeRef.current = (timeEnd - timeStart);
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
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
      if (reqAnimFrameRef.current !== null) cancelAnimationFrame(reqAnimFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [videoId]);

  useEffect(() => {
    let isCancelled = false;
    async function fetchCaptions() {
      if (!videoId) return;

      const rangeStart = timeStart;
      const rangeEnd = timeEnd ?? (timeStart + 10);
      stopTimeRef.current = rangeEnd + 1;

      setCaptions([]);

      try {
        const transcriptData = await youtubeService.getCaptions(videoId, undefined, rangeStart, rangeEnd);
        if (!transcriptData || transcriptData.length === 0) return;

        const tolerance = 0.5;
        const caps = transcriptData.filter(
          c => c.start >= rangeStart && c.start <= rangeEnd + tolerance
        );

        if (!isCancelled) {
          setCaptions(caps);
        }
      } catch (err) {
        if (!isCancelled) console.error("Error fetching captions:", err);
      }
    }

    fetchCaptions();
    return () => { isCancelled = true; };
  }, [videoId, timeStart, timeEnd]);

  function onPlayerReady(event: any) {
    const data = event.target.getVideoData();
    if (data) {
      setVideoTitle(data.title || "Linguistic Depth");
      setChannelName(data.author || "");
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
      playerRef.current.seekTo(timeStart);
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
      playerRef.current.seekTo(timeStart);
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
          setCurrentCaption(active ? active.text_en : "");
        }
        reqAnimFrameRef.current = requestAnimationFrame(syncCaptions);
      };

      timeoutRef.current = setTimeout(() => {
        reqAnimFrameRef.current = requestAnimationFrame(syncCaptions);
      }, 200);
    }
  }

  const handleLogoClick = () => navigate('/dashboard');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black font-sans text-zinc-100">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0 bg-zinc-950 border-r border-zinc-900">
          <DashboardSidebar
            grupos={[]}
            activeGroup={null}
            onGroupSelect={handleLogoClick}
            totalPhrases={0}
          />
        </div>

        <main className="flex-1 flex flex-col h-screen overflow-hidden animate-in fade-in duration-500 bg-black">
          
          {/* YouTube Disclaimer Top Bar */}
          <div className="w-full flex items-center justify-center sm:justify-start gap-3 p-3 sm:px-8 border-b border-zinc-900 shrink-0 bg-zinc-950">
            <Youtube className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-[10px] sm:text-xs text-zinc-500 font-medium tracking-wide text-center sm:text-left">
              Este vídeo é incorporado do YouTube. Todos os direitos reservados aos seus criadores.
            </p>
          </div>

          {/* Content Wrapper */}
          <div className="flex-1 overflow-y-auto lg:overflow-hidden p-0 lg:p-6 lg:pb-0 w-full">
             <div className="max-w-[1700px] mx-auto lg:h-full flex flex-col lg:grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-6 lg:gap-8 lg:pb-6">
                
                {/* Left Column: Video */}
                <div className="flex flex-col gap-5 lg:gap-6 w-full mx-auto md:w-[94%] lg:w-full md:mt-4 lg:mt-0 shrink-0 lg:shrink">
                   <div className="w-full aspect-video bg-zinc-950 md:rounded-2xl overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b lg:border border-zinc-900 shrink-0">
                      <div id="youtube-player" className="w-full h-full pointer-events-none absolute inset-0"></div>
                      
                      {/* Video Player overlay when stopped */}
                      {playbackState === 'explanation' && (
                         <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-widest mb-6 uppercase">
                               Faça um estudo da transcrição
                            </h3>
                            <button 
                               onClick={playWithSubtitles}
                               className="px-8 py-3.5 bg-white hover:bg-zinc-200 text-black rounded-full font-bold transition-all shadow-lg flex items-center gap-2 transform hover:scale-105 active:scale-95"
                            >
                               <Play className="w-5 h-5" fill="currentColor" />
                               Continuar
                            </button>
                         </div>
                      )}

                      {/* Subtitles Overlay */}
                      {playbackState === 'with_subs' && currentCaption && (
                        <div className="absolute bottom-6 sm:bottom-10 left-0 w-full text-center z-10 pointer-events-none px-4">
                          <span className="bg-black/90 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-base sm:text-xl lg:text-2xl font-bold backdrop-blur-md inline-block max-w-4xl shadow-2xl border border-white/10">
                            {currentCaption}
                          </span>
                        </div>
                      )}
                   </div>

                   {/* Description text under video (Desktop) */}
                   <div className="hidden lg:flex flex-col gap-4 px-2">
                      <div className="flex items-start justify-between">
                         <div>
                           <h2 className="text-[28px] font-bold text-white mb-3 tracking-tight">{videoTitle || "O Despertar do Estudo: Módulo 1"}</h2>
                           <div className="flex items-center gap-2">
                              <span className="px-3.5 py-1.5 bg-zinc-900 text-zinc-300 rounded-full text-[11px] font-bold tracking-widest border border-zinc-800 uppercase">Avançado</span>
                              <span className="px-3.5 py-1.5 bg-zinc-900 text-zinc-300 rounded-full text-[11px] font-bold tracking-widest border border-zinc-800 uppercase">História da Arte</span>
                           </div>
                         </div>
                      </div>
                      <p className="text-zinc-500 text-[15px] mt-2 border-t border-zinc-900 pt-4">
                         Referência: <a href={`https://youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors font-medium">{videoTitle}</a> por <span className="text-zinc-400">{channelName}</span>
                      </p>
                   </div>
                   
                   {/* Mobile reference */}
                   <div className="lg:hidden px-5 mb-2 flex justify-between items-center text-xs text-zinc-500">
                     <span className="truncate">Ref: {channelName}</span>
                   </div>
                </div>

                {/* Right Column (Desktop) / Bottom Column (Mobile): Explanation and Transcript */}
                <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-0 pb-[120px] lg:pb-0 lg:h-full lg:overflow-hidden relative">
                   {playbackState !== 'initial' && (
                     <>
                       <div className="flex-1 lg:overflow-hidden flex flex-col min-h-[400px]">
                          <TranscriptPanel captions={captions} currentCaptionText={currentCaption} />
                       </div>
                     </>
                   )}
                </div>

             </div>
          </div>

          <MobileBottomBar onRepeat={play10Seconds} onContinue={playWithSubtitles} />
        </main>
      </div>
    </SidebarProvider>
  );
}
