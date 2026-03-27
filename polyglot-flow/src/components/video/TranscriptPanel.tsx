import React, { useEffect, useRef, useState } from 'react';
import { TranslationSegment } from "@/services/youtubeService";
import { RefreshCw, MessageCircle } from "lucide-react";
import { TranslationModal } from "./TranslationModal";
import { InlineExplanation } from "./InlineExplanation";

interface TranscriptPanelProps {
  captions: TranslationSegment[];
  currentCaptionText: string;
}

export function TranscriptPanel({ captions, currentCaptionText }: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSegment, setSelectedSegment] = useState<TranslationSegment | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (containerRef.current && !selectedSegment) {
       const activeEl = containerRef.current.querySelector('.active-caption');
       if (activeEl) {
         activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
    }
  }, [currentCaptionText, selectedSegment]);

  const handleSegmentClick = (segment: TranslationSegment, index: number) => {
    const isMobile = window.innerWidth < 1024;
    
    if (isMobile) {
      setExpandedIndex(expandedIndex === index ? null : index);
    } else {
      setSelectedSegment(segment);
    }
  };

  return (
    <div className="flex-1 min-h-[300px] flex flex-col mt-2 lg:mt-0 lg:overflow-hidden w-full relative">
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold font-sans">
          Sincronia e Transcrição
        </span>
        <div className="flex items-center gap-1.5 bg-zinc-900 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-full">
          <RefreshCw className="w-3 h-3 animate-spin duration-[3000ms]" />
          <span className="text-[10px] font-bold tracking-wider">LIVE SYNC</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-6 lg:pb-0"
      >
        {captions.map((c, i) => {
          const isActive = currentCaptionText === c.text_en;
          const isExpanded = expandedIndex === i;

          return (
            <div 
              key={i} 
              onClick={() => handleSegmentClick(c, i)}
              className={`relative flex flex-col gap-2 p-5 rounded-2xl transition-all duration-500 border-l-4 cursor-pointer group ${
                isActive 
                  ? 'bg-zinc-900 border-white shadow-lg active-caption' 
                  : 'bg-black/50 border-transparent hover:bg-zinc-900/50'
              } ${isExpanded ? 'ring-1 ring-white/20' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                 <span className={`text-[10px] font-mono px-2 py-1 rounded-md ${isActive ? 'bg-zinc-800 text-zinc-300' : 'bg-white/5 text-zinc-500'}`}>
                    {Math.floor(c.start / 60).toString().padStart(2, '0')}:{(Math.floor(c.start % 60)).toString().padStart(2, '0')}
                 </span>
                 <MessageCircle className={`w-3.5 h-3.5 transition-opacity ${isActive || isExpanded ? 'opacity-100 text-zinc-400' : 'opacity-0 group-hover:opacity-100 text-zinc-600'}`} />
              </div>

              <p className={`text-[15px] leading-relaxed font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                "{c.text_en}"
              </p>
              
              {c.text_pt && (
                <p className={`text-[14px] italic leading-relaxed ${isActive ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  "{c.text_pt}"
                </p>
              )}

              {/* Mobile Inline Explanation */}
              {isExpanded && <InlineExplanation segment={c} />}
            </div>
          );
        })}
        {captions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
             <p className="italic text-sm">Nenhuma legenda encontrada neste trecho.</p>
          </div>
        )}
      </div>

      {/* Desktop Modal */}
      {selectedSegment && (
        <TranslationModal 
          segment={selectedSegment} 
          onClose={() => setSelectedSegment(null)} 
        />
      )}
    </div>
  );
}
