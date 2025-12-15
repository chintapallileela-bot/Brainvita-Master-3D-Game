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
    <div className={`mt-2 p-3 rounded-2xl w-full max-w-lg mx-auto tray-inset bg-black/10 backdrop-blur-sm border-b border-white/10`}>
      <h3 className={`font-bold mb-2 text-center text-xs uppercase tracking-widest opacity-70 ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
        Collection Tray ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-1 min-h-[30px] px-1">
        {marbles.map((_, i) => (
           <div key={i} className="transform scale-75 origin-center">
             <Marble theme={theme} id={1000 + i} />
           </div>
        ))}
        {count === 0 && <span className="text-gray-400/50 text-xs italic py-1">Eliminated marbles appear here</span>}
      </div>
    </div>
  );
};