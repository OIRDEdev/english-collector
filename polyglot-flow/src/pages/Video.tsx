import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Menu, Video as VideoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VideoGrid, VideoData } from "@/components/video/VideoGrid";

const mockVideos: VideoData[] = [
{
  id: `video-1`,
  videoId: "IU_dMJ-3fk8",
  title: "Aprenda as Cores em Inglês ✨ - Músicas e Canções para Crianças e Bebês",
  timeStart: 0,
  timeEnd: 10,
},
{
  id: `video-2`,
  videoId: "r0Lzz3pIAXU",
  title: "Aprenda as Cores em Inglês ✨ - Músicas e Canções para Crianças e Bebês",
  timeStart: 134,
  timeEnd: 145,
},
{
  id: `video-3`,
  videoId: "r0Lzz3pIAXU",
  title: "Aprenda as Cores em Inglês ✨ - Parte 2",
  timeStart: 30,
  timeEnd: 40,
},
{
  id: `video-4`,
  videoId: "IU_dMJ-3fk8",
  title: "Aprenda as Cores em Inglês ✨ - Músicas e Canções para Crianças e Bebês",
  timeStart: 0,
  timeEnd: 10,
},
{
  id: `video-5`,
  videoId: "IU_dMJ-3fk8",
  title: "Aprenda as Cores em Inglês ✨ - Parte 3",
  timeStart: 60,
  timeEnd: 70,
},
{
  id: `video-6`,
  videoId: "IU_dMJ-3fk8",
  title: "Aprenda as Cores em Inglês ✨ - Músicas e Canções para Crianças e Bebês",
  timeStart: 0,
  timeEnd: 10,
},
{
  id: `video-7`,
  videoId: "IU_dMJ-3fk8",
  title: "Aprenda as Cores em Inglês ✨ - Parte 4",
  timeStart: 90,
  timeEnd: 100,
},
{
  id: `video-8`,
  videoId: "IU_dMJ-3fk8",
  title: "Aprenda as Cores em Inglês ✨ - Músicas e Canções para Crianças e Bebês",
  timeStart: 120,
  timeEnd: 130,
},
{
  id: `video-9`,
  videoId: "IU_dMJ-3fk8",
  title: "Aprenda as Cores em Inglês ✨ - Músicas e Canções para Crianças e Bebês",
  timeStart: 150,
  timeEnd: 160,
},
{
  id: `video-10`,
  videoId: "IU_dMJ-3fk8",
  title: "Aprenda as Cores em Inglês ✨ - Músicas e Canções para Crianças e Bebês",
  timeStart: 180,
  timeEnd: 190,
},

]

const Video = () => {
  const navigate = useNavigate();

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
          <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger className="mr-4">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-50">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                <VideoIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-none tracking-tight">Vídeos</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                  Assista e aprenda com vídeos do YouTube
                </p>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 lg:p-8 xl:p-10 overflow-y-auto w-full">
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Recomendados para você</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm max-w-2xl">
                  Pratique sua audição e expanda seu vocabulário com essa seleção de vídeos curtos.
                </p>
              </div>
              
              <VideoGrid videos={mockVideos} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Video;
