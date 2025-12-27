
import React, { useState, useEffect } from 'react';
import { BoardState, CellState, Position, Theme } from '../types';
import { Marble } from './Marble';
import { MoveOverlay } from './MoveOverlay';

interface BoardProps {
  board: BoardState;
  selectedPos: Position | null;
  validMoves: Position[];
  onCellClick: (pos: Position) => void;
  theme: Theme;
  animatingMove: { from: Position; to: Position; mid: Position } | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
}

export const Board: React.FC<BoardProps> = ({ 
  board, 
  selectedPos, 
  validMoves, 
  onCellClick, 
  theme,
  animatingMove,
  boardRef
}) => {
  const [lastLandedPos, setLastLandedPos] = useState<Position | null>(null);

  // Detect when a move just finished to trigger landing animation
  useEffect(() => {
    if (animatingMove) {
      setLastLandedPos(animatingMove.to);
    } else {
      // Keep the landing animation state for a short duration
      const timer = setTimeout(() => setLastLandedPos(null), 500);
      return () => clearTimeout(timer);
    }
  }, [animatingMove]);

  return (
    <div className="board-container-3d flex justify-center relative pointer-events-none" style={{ touchAction: 'none' }}>
      <div 
        ref={boardRef}
        className="relative p-2 md:p-6 rounded-full inline-block board-base pointer-events-none bg-gradient-to-b from-slate-600 to-slate-900 shadow-3xl"
      >
          {/* Outer Bezel */}
          <div className="rounded-full p-2 md:p-4 bg-gradient-to-br from-slate-300 via-slate-600 to-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.95)] border-b-[4px] border-black/50">
            
            <div className={`relative p-4 md:p-8 rounded-full ${theme.boardBg} ${theme.boardBorder} border border-white/20 shadow-[inset_0_20px_50px_rgba(0,0,0,1)]`}>
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    <div className={`absolute inset-3 md:inset-7 rounded-full border opacity-15 ${theme.grooveBorder}`}></div>
                </div>
                
                {animatingMove && (
                  <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
                )}

                <div className="grid grid-cols-7 gap-1.5 md:gap-4 relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                  {board.map((row, rIndex) => (
                    <React.Fragment key={rIndex}>
                      {row.map((cell, cIndex) => {
                        const isInvalid = cell === CellState.INVALID;
                        const isSelected = selectedPos?.row === rIndex && selectedPos?.col === cIndex;
                        const hasMarble = cell === CellState.MARBLE;
                        const isValidDestination = validMoves.some(m => m.row === rIndex && m.col === cIndex);
                        const isAnimatingSource = animatingMove?.from.row === rIndex && animatingMove?.from.col === cIndex;
                        const isAnimatingMid = animatingMove?.mid.row === rIndex && animatingMove?.mid.col === cIndex;
                        const isJustLanded = lastLandedPos?.row === rIndex && lastLandedPos?.col === cIndex;

                        if (isInvalid) return <div key={`${rIndex}-${cIndex}`} className="w-10 h-10 md:w-16 md:h-16" />;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            className="w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center relative pointer-events-auto"
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ transformStyle: 'preserve-3d', transform: 'translateZ(1px)' }}
                          >
                            <div className={`absolute w-9 h-9 md:w-14 md:h-14 rounded-full hole-3d transition-all ${isValidDestination ? 'bg-green-500/40 ring-2 ring-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]' : ''}`} />
                            {hasMarble && !isAnimatingSource && (
                              <div className="relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                                <Marble 
                                  id={rIndex * 7 + cIndex} 
                                  isSelected={isSelected} 
                                  theme={theme} 
                                  isRemoving={isAnimatingMid}
                                  isNew={isJustLanded && !animatingMove}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};
