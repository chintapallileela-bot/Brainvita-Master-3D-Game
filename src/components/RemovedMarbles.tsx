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
    <div className="py-1 px-1.5 rounded-xl w-full max-w-[80px] mx-auto bg-sky-400/90 backdrop-blur-md border border-sky-300 shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] ring-1 ring-sky-500/20">
      <h3 className="font-black mb-0.5 text-center text-[5px] uppercase tracking-[0.1em] text-sky-950 leading-none">
        TRAY ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-0 min-h-[12px] px-0.5 max-h-6 overflow-y-auto custom-scrollbar items-center">
        {marbles.map((_, i) => (
           <div key={i} className="transform scale-[0.12] origin-center -m-[14px] opacity-90 hover:opacity-100 transition-all">
             <Marble theme={theme} id={2000 + i} />
           </div>
        ))}
        {count === 0 && (
          <span className="text-[5px] font-black uppercase tracking-widest opacity-40 italic py-0.5 text-sky-900">
            0
          </span>
        )}
      </div>
    </div>
  );
};