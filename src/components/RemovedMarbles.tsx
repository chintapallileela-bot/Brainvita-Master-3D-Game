
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
    <div className="py-2 px-3 rounded-2xl w-full max-w-[220px] mx-auto tray-inset bg-black/70 backdrop-blur-2xl border border-white/10 shadow-2xl">
      <h3 className="font-black mb-1 text-center text-[7px] uppercase tracking-[0.3em] opacity-80 text-white">
        Collected ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-0.5 min-h-[22px] px-1 max-h-10 overflow-y-auto custom-scrollbar items-center">
        {marbles.map((_, i) => (
           <div key={i} className="transform scale-[0.2] origin-center -m-[11px]">
             <Marble theme={theme} id={2000 + i} />
           </div>
        ))}
        {count === 0 && (
          <span className="text-[7px] font-bold uppercase tracking-widest opacity-40 italic py-1 text-white">
            Tray Empty
          </span>
        )}
      </div>
    </div>
  );
};
