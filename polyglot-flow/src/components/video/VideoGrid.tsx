import { VideoCard } from "./VideoCard";

export interface VideoData {
  id: string;
  videoId: string;
  title: string;
  timeStart?: number;
  timeEnd?: number;
}

interface VideoGridProps {
  videos: VideoData[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full max-w-[1600px] mx-auto">
      {videos.map((video) => (
        <VideoCard 
          key={video.id} 
          videoId={video.videoId} 
          title={video.title}
          timeStart={video.timeStart}
          timeEnd={video.timeEnd}
        />
      ))}
    </div>
  );
}
