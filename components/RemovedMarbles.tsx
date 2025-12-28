
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
    <div className="relative w-full max-w-[500px] mx-auto group perspective-[1000px]">
      {/* Collection Bin - Sleek Dark Container from Screenshot */}
      <div className="relative h-20 rounded-2xl bg-black/90 backdrop-blur-3xl border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,1)] overflow-hidden tray-inset transition-all duration-500">
        
        {/* Label Bar */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-black/80 flex items-center justify-center border-b border-white/5 z-20">
          <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-white/40 select-none">
            COLLECTION BIN • {count} PIECES
          </h3>
        </div>

        {/* Content Area */}
        <div className="absolute inset-0 pt-8 pb-3 px-6 flex flex-wrap justify-center content-start gap-1.5 overflow-y-auto custom-scrollbar">
          {marbles.map((_, i) => (
             <div 
               key={i} 
               className="w-5 h-5 sm:w-6 sm:h-6 opacity-80 hover:opacity-100 transition-all cursor-default drop-shadow-md"
             >
               <Marble theme={theme} id={4000 + i} />
             </div>
          ))}
          
          {count === 0 && (
            <div className="h-full w-full flex flex-col items-center justify-center gap-1 opacity-20 mt-1">
               <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
               <span className="text-[9px] font-black uppercase tracking-[0.6em] text-white">EMPTY BIN</span>
            </div>
          )}
        </div>

        {/* Glossy Overlay */}
        <div className="absolute top-0 inset-x-0 h-[40%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10"></div>
      </div>
    </div>
  );
};
