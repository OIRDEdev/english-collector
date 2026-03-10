import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Menu, Video as VideoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Video = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          grupos={[]}
          activeGroup={null}
          onGroupSelect={() => navigate("/dashboard")}
          totalPhrases={0}
        />

        <main className="flex-1 flex flex-col animate-in fade-in duration-500">
          {/* Header */}
          <header className="h-16 border-b border-border/50 flex items-center px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-4 md:hidden">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-3 text-foreground">
              <div className="p-2 bg-primary/10 rounded-lg">
                <VideoIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-none">Vídeos</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Assista e aprenda com vídeos
                </p>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <VideoIcon className="w-10 h-10 text-primary/60" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Em breve</h2>
                <p className="text-muted-foreground max-w-sm">
                  A seção de vídeos está sendo preparada. Volte em breve para assistir conteúdos incríveis!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Video;
