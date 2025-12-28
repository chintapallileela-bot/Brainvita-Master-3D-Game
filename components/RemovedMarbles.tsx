
import React from 'react';
import { Marble } from './Marble';
import { Theme } from '../types';

interface RemovedMarblesProps {
  count: number;
  theme: Theme;
}

export const RemovedMarbles: React.FC<RemovedMarblesProps> = ({ count, theme }) => {
  const marbles = Array.from({ length: count });

  return (
    <div className="relative w-full max-w-[340px] mx-auto group perspective-[1000px]">
      {/* 3D Box Main Body - Slightly reduced height to fit smaller marbles */}
      <div className="relative h-20 sm:h-24 rounded-2xl bg-gradient-to-b from-slate-900/90 to-black/95 backdrop-blur-3xl border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.9),inset_0_4px_20px_rgba(0,0,0,1)] overflow-hidden tray-inset transition-all duration-500 hover:border-white/20">
        
        {/* Subtle Side Wall Shading */}
        <div className="absolute inset-y-0 left-0 w-3 bg-white/5 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-3 bg-black/40 pointer-events-none"></div>

        {/* Box Top Label Bar */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-black/60 flex items-center justify-center border-b border-white/5 z-20">
          <h3 className="font-black text-[9px] uppercase tracking-[0.4em] text-white/60 select-none">
            COLLECTION BIN • {count} PIECES
          </h3>
        </div>

        {/* Inset Marble Content Area */}
        <div className="absolute inset-0 pt-9 pb-3 px-4 flex flex-wrap justify-center content-start gap-1 overflow-y-auto custom-scrollbar">
          {marbles.map((_, i) => (
             <div 
               key={i} 
               className="w-5 h-5 sm:w-6 sm:h-6 opacity-95 hover:opacity-100 transition-all cursor-default drop-shadow-md"
             >
               <Marble theme={theme} id={3000 + i} />
             </div>
          ))}
          
          {count === 0 && (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 opacity-10 animate-pulse mt-2">
               <div className="w-2 h-2 rounded-full bg-white/40"></div>
               <span className="text-[8px] font-black uppercase tracking-[0.6em] text-white">Empty Tray</span>
            </div>
          )}
        </div>

        {/* Glossy Top Reflection */}
        <div className="absolute top-0 inset-x-0 h-[40%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10"></div>
      </div>
      
      {/* 3D Base Shadow Depth */}
      <div className="absolute -bottom-2 inset-x-3 h-6 bg-black/70 rounded-b-2xl -z-10 blur-[6px]"></div>
    </div>
  );
};
