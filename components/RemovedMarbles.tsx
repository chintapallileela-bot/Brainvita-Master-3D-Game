import React from 'react';
import { Marble } from './Marble';
import { Theme } from '../types';

interface RemovedMarblesProps {
  count: number;
  theme: Theme;
}

export const RemovedMarbles: React.FC<RemovedMarblesProps> = ({ count, theme }) => {
  return (
    <div className="py-2 px-4 rounded-3xl w-full max-w-[120px] mx-auto bg-black/40 backdrop-blur-xl border border-white/10 shadow-inner ring-1 ring-white/5">
      <h3 className="font-black mb-1 text-center text-[8px] uppercase tracking-[0.4em] opacity-40 text-white">
        Tray ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-0.5 min-h-[16px] max-h-8 overflow-y-auto custom-scrollbar items-center">
        {Array.from({ length: count }).map((_, i) => (
           <div key={i} className="transform scale-[0.2] origin-center -m-[12px]">
             <Marble theme={theme} id={3000 + i} />
           </div>
        ))}
        {count === 0 && <span className="text-[10px] opacity-20 font-black">Empty</span>}
      </div>
    </div>
  );
};