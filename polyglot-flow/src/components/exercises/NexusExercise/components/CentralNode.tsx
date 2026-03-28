import React from "react";
import { Star } from "lucide-react";

interface CentralNodeProps {
  palavraCentral: string;
}

const CentralNode = React.memo(function CentralNode({ palavraCentral }: CentralNodeProps) {
  return (
    <div className="relative z-20 w-32 h-32 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_60px_-10px_rgba(34,211,238,0.4)] flex items-center justify-center transform transition-transform hover:scale-105 duration-500 group animate-float">
      <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping opacity-20" />
      <div className="text-center z-10 p-2 md:p-4">
        <h3 className="text-xl md:text-4xl font-black text-white drop-shadow-lg tracking-tight break-all">
          {palavraCentral}
        </h3>
        <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-300 mx-auto mt-1 md:mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
});

export default CentralNode;
