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
      // Store the destination of the current animation
      setLastLandedPos(animatingMove.to);
    } else if (lastLandedPos) {
      // Keep the landing state active briefly after move ends to show animation
      const timer = setTimeout(() => setLastLandedPos(null), 500);
      return () => clearTimeout(timer);
    }
  }, [animatingMove, lastLandedPos]);

  return (
    <div className="board-container-3d flex justify-center relative pointer-events-none" style={{ touchAction: 'none' }}>
      {/* Floor reflection / Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] blur-[120px] rounded-full -z-10 opacity-30 ${theme.isDark ? 'bg-indigo-500/20' : 'bg-white/40'}`}></div>

      <div 
        ref={boardRef}
        className="relative p-2 md:p-6 rounded-full inline-block board-base pointer-events-none bg-gradient-to-b from-slate-700 to-slate-950"
      >
          {/* Main Bezel */}
          <div className="rounded-full p-2 md:p-5 bg-gradient-to-br from-slate-400 via-slate-700 to-slate-900 shadow-[0_30px_70px_rgba(0,0,0,1)] border-b-[5px] border-black/60 relative">
            
            {/* Outer Rim Highlight */}
            <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none"></div>

            <div className={`relative p-5 md:p-10 rounded-full ${theme.boardBg} ${theme.boardBorder} border border-white/20 shadow-[inset_0_25px_60px_rgba(0,0,0,1)]`}>
                
                {/* Surface Specular Map / Grain */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
                    <div className={`absolute inset-4 md:inset-8 rounded-full border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]`}></div>
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>
                
                {animatingMove && (
                  <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
                )}

                <div className="grid grid-cols-7 gap-3 md:gap-6 relative z-10" style={{ transformStyle: 'preserve-3d' }}>
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

                        if (isInvalid) return <div key={`${rIndex}-${cIndex}`} className="w-11 h-11 md:w-18 md:h-18" />;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            className="w-11 h-11 md:w-18 md:h-18 rounded-full flex items-center justify-center relative pointer-events-auto"
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ transformStyle: 'preserve-3d', transform: 'translateZ(2px)' }}
                          >
                            <div className={`absolute w-10 h-10 md:w-17 md:h-17 rounded-full hole-3d transition-all duration-300 
                              ${isValidDestination ? 'bg-green-500/20 ring-2 ring-green-400 shadow-[0_0_25px_rgba(74,222,128,0.4)]' : ''}
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
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-3 h-3 rounded-full bg-green-400/80 shadow-[0_0_15px_#4ade80] animate-pulse"
                                     style={{ transform: 'translateZ(30px)' }}
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