import React from 'react';
import { BoardState, Position, Theme } from '../types.ts';
import { Marble } from './Marble.tsx';

interface BoardProps {
  board: BoardState;
  selectedPos: Position | null;
  validDestinations: Position[];
  onCellClick: (pos: Position) => void;
  theme: Theme;
}

export const Board: React.FC<BoardProps> = ({
  board,
  selectedPos,
  validDestinations,
  onCellClick,
  theme
}) => {
  const isSelected = (r: number, c: number) => {
    return selectedPos?.row === r && selectedPos?.col === c;
  };

  const isValidDestination = (r: number, c: number) => {
    return validDestinations.some(dest => dest.row === r && dest.col === c);
  };

  return (
    <div className={`relative p-5 sm:p-6 md:p-8 rounded-full border-4 ${theme.boardBg} ${theme.boardBorder} transition-all duration-300 max-w-full aspect-square flex items-center justify-center`}>
      {/* circular shadow and rim reflections */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/50 via-transparent to-white/10 pointer-events-none border border-white/5" />
      <div className="absolute inset-2 rounded-full border-2 border-black/30 pointer-events-none" />
      <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none" />

      {/* Grid container */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 md:gap-3.5 relative z-10 w-full h-full max-w-lg aspect-square">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className="flex items-center justify-center aspect-square"
            >
              <Marble
                state={cell}
                isSelected={isSelected(rIdx, cIdx)}
                isValidDest={isValidDestination(rIdx, cIdx)}
                onClick={() => onCellClick({ row: rIdx, col: cIdx })}
                theme={theme}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
