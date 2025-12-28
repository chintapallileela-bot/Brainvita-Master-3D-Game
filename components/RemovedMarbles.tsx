
import React from 'react';
import { Theme } from '../types';

interface RemovedMarblesProps {
  count: number;
  theme: Theme;
}

export const RemovedMarbles: React.FC<RemovedMarblesProps> = ({ count, theme }) => {
  return (
    <div className="relative w-full max-w-[200px] mx-auto perspective-[1000px]">
      <div className="relative h-12 rounded-full bg-black/90 backdrop-blur-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,1)] overflow-hidden tray-inset transition-all duration-500">
        <div className="absolute top-0 left-0 right-0 h-4 bg-black/40 flex items-center justify-center border-b border-white/5 z-20">
          <h3 className="font-black text-[7px] uppercase tracking-[0.3em] text-white/30 select-none">
            BIN • {count}
          </h3>
        </div>
        <div className="absolute inset-0 pt-5 pb-1 px-4 flex flex-wrap justify-center content-start gap-1.5 overflow-hidden">
          {Array.from({ length: Math.min(count, 48) }).map((_, i) => (
             <div key={i} className="w-1.5 h-1.5 rounded-full shadow-inner opacity-60" 
                  style={{ background: `radial-gradient(circle at 30% 30%, ${theme.marbleStart} 0%, ${theme.marbleEnd} 100%)` }} 
             />
          ))}
          {count === 0 && (
            <div className="h-full w-full flex items-center justify-center opacity-10 pt-1">
               <span className="text-[6px] font-black uppercase tracking-[0.5em] text-white">EMPTY</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
