
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
    <div className="relative w-full max-w-[240px] mx-auto group perspective-[1000px]">
      {/* 3D Box Main Body - Reduced height and max-width */}
      <div className="relative h-14 rounded-xl bg-gradient-to-b from-slate-900/90 to-black/95 backdrop-blur-3xl border border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(0,0,0,0.9)] overflow-hidden tray-inset transition-all duration-500 hover:border-white/20">
        
        {/* Subtle Side Wall Shading */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-white/5 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-1.5 bg-black/40 pointer-events-none"></div>

        {/* Box Top Label Bar */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-black/40 flex items-center justify-center border-b border-white/5 z-20">
          <h3 className="font-black text-[7px] uppercase tracking-[0.3em] text-white/40 select-none">
            COLLECTION BIN • {count}
          </h3>
        </div>

        {/* Inset Marble Content Area - More compact layout */}
        <div className="absolute inset-0 pt-5 pb-1 px-2 flex flex-wrap justify-center content-start gap-0.5 overflow-y-auto custom-scrollbar">
          {marbles.map((_, i) => (
             <div key={i} className="transform scale-[0.11] origin-center -m-[18.5px] opacity-80 hover:opacity-100 hover:scale-[0.14] transition-all cursor-default">
               <Marble theme={theme} id={3000 + i} />
             </div>
          ))}
          
          {count === 0 && (
            <div className="h-full w-full flex flex-col items-center justify-center gap-0.5 opacity-20 mt-1">
               <div className="w-1 h-1 rounded-full bg-white/30"></div>
               <span className="text-[6px] font-black uppercase tracking-[0.5em] text-white">EMPTY</span>
            </div>
          )}
        </div>

        {/* Glossy Top Reflection */}
        <div className="absolute top-0 inset-x-0 h-[30%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10"></div>
      </div>
      
      {/* 3D Base Shadow Depth */}
      <div className="absolute -bottom-1 inset-x-2 h-3 bg-black/60 rounded-b-xl -z-10 blur-[3px]"></div>
    </div>
  );
};
