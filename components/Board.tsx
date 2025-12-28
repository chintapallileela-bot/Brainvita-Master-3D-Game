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

  useEffect(() => {
    if (animatingMove) {
      setLastLandedPos(animatingMove.to);
    } else if (lastLandedPos) {
      const timer = setTimeout(() => setLastLandedPos(null), 500);
      return () => clearTimeout(timer);
    }
  }, [animatingMove, lastLandedPos]);

  return (
    <div className="board-container-3d flex justify-center relative pointer-events-none" style={{ touchAction: 'none' }}>
      {/* Floor reflection / Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] blur-[140px] rounded-full -z-10 opacity-30 ${theme.isDark ? 'bg-indigo-500/20' : 'bg-white/40'}`}></div>

      <div 
        ref={boardRef}
        className="relative p-4 md:p-10 rounded-full inline-block board-base pointer-events-none bg-gradient-to-b from-slate-700 to-slate-950"
      >
          {/* Main Bezel */}
          <div className="rounded-full p-4 md:p-8 bg-gradient-to-br from-slate-400 via-slate-700 to-slate-900 shadow-[0_35px_80px_rgba(0,0,0,1)] border-b-[8px] border-black/60 relative">
            
            {/* Outer Rim Highlight */}
            <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none"></div>

            <div className={`relative p-8 md:p-14 rounded-full ${theme.boardBg} ${theme.boardBorder} border border-white/20 shadow-[inset_0_30px_70px_rgba(0,0,0,1)]`}>
                
                {/* Surface Specular Map / Grain */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
                    <div className={`absolute inset-6 md:inset-12 rounded-full border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)]`}></div>
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>
                
                {animatingMove && (
                  <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
                )}

                {/* Increased grid size and gaps */}
                <div className="grid grid-cols-7 gap-5 md:gap-10 relative z-10" style={{ transformStyle: 'preserve-3d' }}>
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

                        // Increased cell sizes: w-12 -> w-14, w-20 -> w-24
                        if (isInvalid) return <div key={`${rIndex}-${cIndex}`} className="w-14 h-14 md:w-24 md:h-24" />;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            className="w-14 h-14 md:w-24 md:h-24 rounded-full flex items-center justify-center relative pointer-events-auto"
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ transformStyle: 'preserve-3d', transform: 'translateZ(2px)' }}
                          >
                            <div className={`absolute w-13 h-13 md:w-23 md:h-23 rounded-full hole-3d transition-all duration-300 
                              ${isValidDestination ? 'bg-green-500/20 ring-2 ring-green-400 shadow-[0_0_30px_rgba(74,222,128,0.5)]' : ''}
                              ${(isJustLanded && !animatingMove) ? 'hole-impact' : ''}
                            `}>
                                <div className="hole-rim-highlight"></div>
                            </div>

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

                            {isValidDestination && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-4 h-4 rounded-full bg-green-400/80 shadow-[0_0_20px_#4ade80] animate-pulse"
                                     style={{ transform: 'translateZ(35px)' }}
                                ></div>
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