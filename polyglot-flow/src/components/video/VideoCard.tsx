import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";

interface VideoCardProps {
  videoId: string;
  title: string;
}

export function VideoCard({ videoId, title }: VideoCardProps) {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  
  return (
    <Link to={`/video/${videoId}`} className="block h-full group">
      <Card className="overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors h-full flex flex-col shadow-sm hover:shadow-md">
        <div className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Fallback to hqdefault if maxresdefault doesn't exist
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
             <div className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform duration-300 group-hover:bg-primary/90">
                <Play className="w-5 h-5 ml-1" fill="currentColor" />
             </div>
          </div>
        </div>
        <CardHeader className="p-4 flex-1">
          <CardTitle className="text-sm font-medium line-clamp-2 leading-relaxed text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}
