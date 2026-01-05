
import React from 'react';
import { Marble } from './Marble';
import { Theme } from '../types';

interface RemovedMarblesProps {
  count: number;
  theme: Theme;
}

export const RemovedMarbles: React.FC<RemovedMarblesProps> = ({ count, theme }) => {
  const marbles = Array.from({ length: Math.min(count, 32) });

  return (
    <div className="relative w-full group perspective-[1200px]">
      <div className="relative h-16 sm:h-20 md:h-32 lg:h-40 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/95 to-black/98 backdrop-blur-3xl border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(0,0,0,0.8)] overflow-hidden tray-inset transition-all duration-500 hover:border-white/20">
        
        <div className="absolute top-0 left-0 right-0 h-4 sm:h-5 bg-black/60 flex items-center justify-center border-b border-white/5 z-20">
          <h3 className="font-black text-[7px] sm:text-[8px] uppercase tracking-[0.4em] text-white/40 select-none">
            COLLECTION • {count}
          </h3>
        </div>

        <div className="absolute inset-0 pt-5 sm:pt-6 pb-2 px-2 flex flex-wrap justify-center content-start gap-1 overflow-y-auto custom-scrollbar">
          {marbles.map((_, i) => (
             <div key={i} className="transform scale-[0.08] sm:scale-[0.1] md:scale-[0.14] origin-center -m-[20px] sm:-m-[18px] md:-m-[14px] opacity-80 transition-all cursor-default">
               <Marble theme={theme} id={4000 + i} />
             </div>
          ))}
          
          {count === 0 && (
            <div className="h-full w-full flex flex-col items-center justify-center gap-1 opacity-10">
               <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white">VACANT</span>
            </div>
          )}
        </div>
        <div className="absolute top-0 inset-x-0 h-[30%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10"></div>
      </div>
    </div>
  );
};
