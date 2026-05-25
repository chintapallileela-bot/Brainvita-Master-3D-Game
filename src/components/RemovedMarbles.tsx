import React from 'react';
import { Theme } from '../types.ts';

interface RemovedMarblesProps {
  totalCount: number;
  currentCount: number;
  theme: Theme;
}

export const RemovedMarbles: React.FC<RemovedMarblesProps> = ({
  totalCount,
  currentCount,
  theme
}) => {
  const removedCount = Math.max(0, totalCount - currentCount);

  // Array representing the captured pegs tray
  const slots = Array.from({ length: Math.min(removedCount, 36) });

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md w-full max-w-sm">
      <div className="flex justify-between items-center w-full px-2">
        <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Captured Pegs</span>
        <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
          +{removedCount}
        </span>
      </div>

      {/* Scrollable / wrapped tray */}
      <div className="flex flex-wrap gap-1.5 justify-center items-center py-1 w-full max-h-20 sm:max-h-24 overflow-y-auto no-scrollbar">
        {slots.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-3">No marbles captured yet</div>
        ) : (
          slots.map((_, idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full ${theme.marbleBg} ring-1 ring-black/40 shadow-md transform scale-90 sm:scale-100 transition-all duration-300 animate-[bounce_0.3s_ease-out_1]`}
              style={{
                boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.8), inset 1px 1px 2px rgba(255,255,255,0.4)',
                animationDelay: `${idx * 0.02}s`
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
