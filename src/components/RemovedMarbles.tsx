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
    <div className={`p-4 rounded-[2rem] w-full max-w-sm mx-auto tray-inset bg-black/60 backdrop-blur-xl border border-white/10`}>
      <h3 className={`font-black mb-2 text-center text-[10px] uppercase tracking-[0.4em] opacity-80 ${theme.isDark ? 'text-white' : 'text-slate-200'}`}>
        Collection Tray ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-1 min-h-[44px] px-1 max-h-24 overflow-y-auto custom-scrollbar">
        {marbles.map((_, i) => (
           <div key={i} className="transform scale-[0.6] origin-center hover:scale-[0.8] transition-transform duration-200">
             <Marble theme={theme} id={2000 + i} />
           </div>
        ))}
        {count === 0 && (
          <span className={`text-[10px] font-bold uppercase tracking-widest opacity-40 italic py-2 ${theme.isDark ? 'text-white' : 'text-slate-400'}`}>
            Removed marbles appear here
          </span>
        )}
      </div>
    </div>
  );
};