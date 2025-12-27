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
    <div className="py-1 px-3 rounded-[0.75rem] w-full max-w-[200px] mx-auto tray-inset bg-black/60 backdrop-blur-xl border border-white/10 shadow-inner">
      <h3 className="font-black mb-0 text-center text-[6px] uppercase tracking-[0.2em] opacity-80 text-white">
        Tray ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-0.5 min-h-[16px] px-1 max-h-8 overflow-y-auto custom-scrollbar items-center">
        {marbles.map((_, i) => (
           <div key={i} className="transform scale-[0.25] origin-center -m-2">
             <Marble theme={theme} id={2000 + i} />
           </div>
        ))}
        {count === 0 && (
          <span className="text-[6px] font-bold uppercase tracking-widest opacity-40 italic py-0.5 text-white">
            Empty
          </span>
        )}
      </div>
    </div>
  );
};