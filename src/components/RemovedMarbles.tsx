
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
    <div className="relative w-full max-w-[200px] lg:max-w-full lg:w-full mx-auto group perspective-[1200px]">
      {/* Container - taller and sleeker for side panel */}
      <div className="relative h-24 lg:h-64 rounded-2xl bg-gradient-to-b from-slate-900/95 to-black/98 backdrop-blur-3xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.9),inset_0_2px_15px_rgba(0,0,0,0.8)] overflow-hidden tray-inset transition-all duration-500 hover:border-white/20">
        
        {/* Box Top Label Bar */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-black/60 flex items-center justify-center border-b border-white/5 z-20">
          <h3 className="font-black text-[9px] lg:text-[10px] uppercase tracking-[0.4em] text-white/40 select-none">
            COLLECTION BIN • {count}
          </h3>
        </div>

        {/* Marble Content Area - Scrollable */}
        <div className="absolute inset-0 pt-8 pb-3 px-3 flex flex-wrap justify-center content-start gap-1 lg:gap-2 overflow-y-auto custom-scrollbar">
          {marbles.map((_, i) => (
             <div key={i} className="transform scale-[0.14] lg:scale-[0.18] origin-center -m-[16px] lg:-m-[12px] opacity-80 hover:opacity-100 hover:scale-[0.16] lg:hover:scale-[0.22] transition-all cursor-default">
               <Marble theme={theme} id={4000 + i} />
             </div>
          ))}
          
          {count === 0 && (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 opacity-10 mt-2">
               <div className="w-2 h-2 rounded-full bg-white/40"></div>
               <span className="text-[8px] font-black uppercase tracking-[0.6em] text-white">RESERVE</span>
            </div>
          )}
        </div>

        {/* Glossy Reflection Overlay */}
        <div className="absolute top-0 inset-x-0 h-[40%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10"></div>
      </div>
      
      {/* Depth Shadow */}
      <div className="absolute -bottom-2 inset-x-4 h-4 bg-black/60 rounded-b-2xl -z-10 blur-[5px]"></div>
    </div>
  );
};
