
import React from 'react';
import { Theme } from '../types';

interface RemovedMarblesProps {
  count: number;
  theme: Theme;
}

export const RemovedMarbles: React.FC<RemovedMarblesProps> = ({ count, theme }) => {
  return (
    <div className="relative w-full max-w-[140px] sm:max-w-[180px] mx-auto group">
      {/* Sleek Stats Badge */}
      <div className="relative h-8 sm:h-10 rounded-full bg-black/90 backdrop-blur-2xl border border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 hover:scale-105 hover:border-white/30 flex items-center px-4 gap-3">
        
        <div className="flex-shrink-0 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full shadow-inner" style={{ background: theme.marbleEnd }}></div>
          <span className="text-[10px] sm:text-[12px] font-black text-white/50 tracking-widest">CLEARED</span>
        </div>

        <div className="flex-1 text-center border-l border-white/10 pl-3">
          <span className="text-sm sm:text-base font-black text-white">{count}</span>
        </div>

        {/* Ambient Gloss */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};
