import React from 'react';
import { TranslationSegment } from '@/services/youtubeService';
import { Info, ChevronRight } from 'lucide-react';

interface InlineExplanationProps {
  segment: TranslationSegment;
}

export function InlineExplanation({ segment }: InlineExplanationProps) {
  return (
    <div className="mt-4 space-y-5 animate-in slide-in-from-top-4 duration-500">
      {/* Explanation Box */}
      <div className="bg-zinc-900/80 border-l-2 border-white p-4 rounded-r-xl">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Contexto & Gramática</span>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">
          {segment.explanation}
        </p>
      </div>

      {/* Mini Mapping List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-1">Vocabulário Chave</span>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(segment.mapping).map(([key, value], idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
              <span className="text-white text-xs font-medium">{key}</span>
              <ChevronRight className="w-3 h-3 text-zinc-700" />
              <span className="text-zinc-500 text-xs italic">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
