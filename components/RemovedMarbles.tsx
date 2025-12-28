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
    <div className={`p-2.5 rounded-[2rem] w-full max-w-[320px] mx-auto tray-inset bg-black/60 backdrop-blur-2xl border border-white/10 shadow-inner flex flex-col items-center`}>
      <h3 className={`font-black mb-1.5 text-center text-[9px] uppercase tracking-[0.3em] opacity-40 ${theme.isDark ? 'text-white' : 'text-slate-200'}`}>
        COLLECTION ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-1 min-h-[40px] px-2 max-h-20 overflow-y-auto custom-scrollbar items-center">
        {marbles.map((_, i) => (
           <div key={i} className="transform scale-[0.4] origin-center -m-[10px] hover:scale-[0.5] transition-transform duration-200">
             <Marble theme={theme} id={2000 + i} />
           </div>
        ))}
        {count === 0 && (
          <span className={`text-[8px] font-bold uppercase tracking-widest opacity-20 italic py-1 ${theme.isDark ? 'text-white' : 'text-slate-400'}`}>
            Ready
          </span>
        )}
      </div>
    </div>
  );
};