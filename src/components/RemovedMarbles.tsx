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
    <div className={`py-1.5 px-3 rounded-[1rem] w-full max-w-[240px] mx-auto tray-inset bg-black/60 backdrop-blur-xl border border-white/10 shadow-inner`}>
      <h3 className={`font-black mb-0.5 text-center text-[7px] uppercase tracking-[0.2em] opacity-80 ${theme.isDark ? 'text-white' : 'text-slate-200'}`}>
        Tray ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-0.5 min-h-[20px] px-1 max-h-12 overflow-y-auto custom-scrollbar items-center">
        {marbles.map((_, i) => (
           <div key={i} className="transform scale-[0.3] origin-center hover:scale-[0.45] transition-transform duration-200 -m-1.5">
             <Marble theme={theme} id={2000 + i} />
           </div>
        ))}
        {count === 0 && (
          <span className={`text-[7px] font-bold uppercase tracking-widest opacity-40 italic py-1 ${theme.isDark ? 'text-white' : 'text-slate-400'}`}>
            Removed marbles here
          </span>
        )}
      </div>
    </div>
  );
};