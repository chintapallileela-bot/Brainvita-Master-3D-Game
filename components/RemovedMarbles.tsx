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
    <div className={`mt-2 p-4 rounded-[2rem] w-full max-w-lg mx-auto tray-inset bg-black/30 backdrop-blur-xl border border-white/10`}>
      <h3 className={`font-black mb-3 text-center text-[10px] uppercase tracking-[0.2em] opacity-80 ${theme.isDark ? 'text-white' : 'text-slate-800'}`}>
        Collection Tray ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-1.5 min-h-[40px] px-2 max-h-24 overflow-y-auto custom-scrollbar">
        {marbles.map((_, i) => (
           <div key={i} className="transform scale-[0.65] origin-center hover:scale-[0.8] transition-transform duration-200">
             <Marble theme={theme} id={1000 + i} />
           </div>
        ))}
        {count === 0 && (
          <span className={`text-[10px] font-bold uppercase tracking-widest opacity-40 italic py-2 ${theme.isDark ? 'text-white' : 'text-slate-600'}`}>
            Eliminated marbles appear here
          </span>
        )}
      </div>
    </div>
  );
};