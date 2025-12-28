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
    <div className="relative w-full max-w-[320px] mx-auto group perspective-[1000px]">
      <div className="relative h-20 rounded-xl bg-gradient-to-b from-slate-900/90 to-black/95 backdrop-blur-3xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_4px_15px_rgba(0,0,0,0.9)] overflow-hidden tray-inset transition-all duration-500 hover:border-white/20">
        <div className="absolute inset-y-0 left-0 w-2 bg-white/5 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-2 bg-black/40 pointer-events-none"></div>
        <div className="absolute top-0 left-0 right-0 h-5 bg-black/40 flex items-center justify-center border-b border-white/5">
          <h3 className="font-black text-[8px] uppercase tracking-[0.3em] text-white/50 select-none">
            COLLECTION BIN • {count} PIECES
          </h3>
        </div>
        <div className="absolute inset-0 pt-7 pb-2 px-3 flex flex-wrap justify-center content-start gap-0.5 overflow-y-auto custom-scrollbar">
          {marbles.map((_, i) => (
             <div key={i} className="transform scale-[0.14] origin-center -m-[16px] opacity-90 hover:opacity-100 hover:scale-[0.18] transition-all cursor-default">
               <Marble theme={theme} id={3000 + i} />
             </div>
          ))}
          {count === 0 && (
            <div className="h-full w-full flex flex-col items-center justify-center gap-1 opacity-20 animate-pulse">
               <div className="w-2 h-2 rounded-full bg-white/30"></div>
               <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white">Empty Bin</span>
            </div>
          )}
        </div>
        <div className="absolute top-0 inset-x-0 h-[30%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
      </div>
      <div className="absolute -bottom-1.5 inset-x-2 h-4 bg-black/60 rounded-b-xl -z-10 blur-[4px]"></div>
    </div>
  );
};