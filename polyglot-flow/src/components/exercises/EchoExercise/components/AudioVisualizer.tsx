import React from "react";
import { Mic, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AudioVisualizerProps {
  isPlaying: boolean;
  onPlay: () => void;
}

const AudioVisualizer = React.memo(function AudioVisualizer({
  isPlaying,
  onPlay,
}: AudioVisualizerProps) {
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={onPlay}
      className={cn(
        "w-16 h-16 rounded-full border-2 transition-all duration-300",
        "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:scale-105",
        isPlaying && "animate-pulse border-blue-400 bg-blue-400/20"
      )}
    >
      {isPlaying ? (
        <Mic className="w-6 h-6 text-blue-400 animate-bounce" />
      ) : (
        <Play className="w-6 h-6 text-blue-400 ml-1" />
      )}
    </Button>
  );
});

export default AudioVisualizer;
