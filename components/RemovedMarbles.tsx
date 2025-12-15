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
    <div className={`mt-8 p-6 rounded-3xl w-full max-w-lg mx-auto tray-inset bg-black/10 backdrop-blur-sm border-b border-white/10`}>
      <h3 className={`font-bold mb-4 text-center text-sm uppercase tracking-widest opacity-70 ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
        Collection Tray ({count})
      </h3>
      <div className="flex flex-wrap justify-center gap-2 min-h-[40px] px-2">
        {marbles.map((_, i) => (
           <div key={i} className="transform scale-75 hover:scale-100 transition-transform duration-200">
             {/* Use a large offset for ID so tray marbles don't look exactly like the first few board marbles */}
             <Marble theme={theme} id={1000 + i} />
           </div>
        ))}
        {count === 0 && <span className="text-gray-400/50 text-sm italic py-2">Eliminated marbles appear here</span>}
      </div>
    </div>
  );
};