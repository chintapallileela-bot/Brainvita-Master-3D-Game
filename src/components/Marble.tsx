import React from 'react';
import { CellState, Theme } from '../types.ts';

interface MarbleProps {
  state: CellState;
  isSelected: boolean;
  isValidDest: boolean;
  onClick: () => void;
  theme: Theme;
}

export const Marble: React.FC<MarbleProps> = ({
  state,
  isSelected,
  isValidDest,
  onClick,
  theme
}) => {
  if (state === CellState.INVALID) {
    return <div className="w-10 h-10 md:w-14 md:h-14 opacity-0 pointer-events-none" />;
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="relative w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full cursor-pointer touch-manipulation group"
      style={{ minWidth: '44px', minHeight: '44px' }}
      aria-label={
        state === CellState.MARBLE
          ? `${isSelected ? 'Selected ' : ''}Marble`
          : isValidDest
          ? 'Valid jump target'
          : 'Empty slot'
      }
    >
      {/* 3D Slot Socket - always visible */}
      <div className="absolute w-[80%] h-[80%] rounded-full bg-black/60 shadow-[inset_0_4px_8px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center">
        {/* Subtle inner center depth hole */}
        <div className="w-[30%] h-[30%] rounded-full bg-black/40 blur-[1px]"></div>
      </div>

      {/* Marble Sphere */}
      {state === CellState.MARBLE && (
        <div
          className={`absolute w-[85%] h-[85%] rounded-full transition-all duration-300 transform-gpu 
            ${isSelected ? 'marble-selected scale-110' : 'hover:scale-105 active:scale-95'} 
            ${isSelected ? theme.selectedMarbleBg : theme.marbleBg}
            shadow-[inset_-4px_-6px_15px_rgba(0,0,0,0.85),inset_6px_6px_10px_rgba(255,255,255,0.4),0_10px_16px_rgba(0,0,0,0.8)]
          `}
        >
          {/* Inner glass glossy highlight */}
          <div className="absolute top-[8%] left-[18%] w-[25%] h-[15%] bg-white/50 rounded-full blur-[0.8px] rotate-[25deg]" />
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />
          
          {/* Glowing border if selected */}
          {isSelected && (
            <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-pulse pointer-events-none" />
          )}
        </div>
      )}

      {/* Valid Destination Indicator */}
      {isValidDest && (
        <div className="absolute w-[85%] h-[85%] rounded-full border-2 border-dashed border-cyan-450 bg-cyan-400/10 animate-pulse flex items-center justify-center transition-all duration-200 hover:bg-cyan-400/20">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        </div>
      )}
    </button>
  );
};
