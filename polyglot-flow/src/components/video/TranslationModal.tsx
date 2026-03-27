import React from 'react';
import { X, BookOpen, MessageSquare } from 'lucide-react';
import { TranslationSegment } from '@/services/youtubeService';

interface TranslationModalProps {
  segment: TranslationSegment;
  onClose: () => void;
}

export function TranslationModal({ segment, onClose }: TranslationModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-900/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-zinc-400" />
             </div>
             <div>
                <h3 className="text-white font-bold text-lg">Estudo de Tradução</h3>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Detail View</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Main Translation */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
                <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">EN</span>
                <span>Original Text</span>
             </div>
             <p className="text-2xl text-white font-medium leading-tight tracking-tight">
                "{segment.text_en}"
             </p>
          </div>

          <div className="space-y-3">
             <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
                <span className="bg-white/10 text-white px-2 py-0.5 rounded">PT</span>
                <span>Tradução Direta</span>
             </div>
             <p className="text-xl text-zinc-300 italic">
                "{segment.text_pt}"
             </p>
          </div>

          {/* Explanation */}
          {segment.explanation && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageSquare className="w-12 h-12" />
               </div>
               <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <div className="w-1 h-4 bg-white rounded-full"></div>
                  Explicação Contextual
               </h4>
               <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                  {segment.explanation}
               </p>
            </div>
          )}

          {/* Mapping Table */}
          {segment.mapping && Object.keys(segment.mapping).length > 0 && (
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Mapeamento de Expressões</h4>
               <div className="grid grid-cols-1 gap-2">
                  {Object.entries(segment.mapping).map(([key, value], idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:bg-zinc-900/50 transition-colors">
                       <span className="text-white font-medium text-sm">{key}</span>
                       <div className="flex-1 border-b border-dotted border-zinc-800 mx-4"></div>
                       <span className="text-zinc-400 text-sm italic">{value}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-900/20 border-t border-zinc-900 flex justify-center">
           <button 
             onClick={onClose}
             className="px-8 py-3 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-white/10"
           >
              Entendi, obrigado!
           </button>
        </div>
      </div>
    </div>
  );
}
