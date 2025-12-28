
import React from 'react';
import { Theme } from '../types';

interface RemovedMarblesProps {
  count: number;
  theme: Theme;
}

export const RemovedMarbles: React.FC<RemovedMarblesProps> = ({ count, theme }) => {
  return (
    <div className="relative w-full max-w-[180px] sm:max-w-[220px] mx-auto perspective-[1000px]">
      <div className="relative h-10 sm:h-12 rounded-full bg-black/95 backdrop-blur-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,1)] overflow-hidden tray-inset transition-all duration-500 hover:border-white/20">
        
        {/* Bin Header */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-black/50 flex items-center justify-center border-b border-white/5 z-20">
          <h3 className="font-black text-[7px] uppercase tracking-[0.3em] text-white/30 select-none">
            COLLECTION BIN • {count}
          </h3>
        </div>

        {/* Marble Progress Indicators */}
        <div className="absolute inset-0 pt-5 pb-1 px-4 flex flex-wrap justify-center content-start gap-1 overflow-hidden">
          {Array.from({ length: Math.min(count, 32) }).map((_, i) => (
             <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner opacity-70 animate-in" 
                  style={{ 
                    background: `radial-gradient(circle at 30% 30%, ${theme.marbleStart} 0%, ${theme.marbleEnd} 100%)`,
                    animationDelay: `${i * 0.05}s`
                  }} 
             />
          ))}
          {count === 0 && (
            <div className="h-full w-full flex items-center justify-center opacity-10 pt-1">
               <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-[0.5em] text-white">EMPTY BIN</span>
            </div>
          )}
        </div>
        
        {/* Glass Overlay */}
        <div className="absolute top-0 inset-x-0 h-[30%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10"></div>
      </div>
    </div>
  );
};
