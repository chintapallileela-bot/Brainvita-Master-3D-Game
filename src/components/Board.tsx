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
      {/* Dynamic floor glow that matches theme */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] blur-[180px] rounded-full -z-10 opacity-40 ${theme.isDark ? 'bg-indigo-500/30' : 'bg-white/50'}`}></div>

      <div 
        ref={boardRef}
        className="relative aspect-square rounded-full inline-block board-base pointer-events-none bg-gradient-to-b from-slate-600 to-slate-900 p-12 md:p-20"
        style={{ transformStyle: 'preserve-3d' }}
      >
          {/* Main Bezel / Outer Rim - Deep Metallic Saucer */}
          <div className="rounded-full p-10 md:p-16 bg-gradient-to-br from-slate-300 via-slate-800 to-slate-950 shadow-[0_60px_120px_rgba(0,0,0,1)] border-b-[20px] border-black relative"
               style={{ transform: 'translateZ(10px)' }}>
            
            {/* Fresnel edge highlight for the saucer rim */}
            <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none"></div>
            
            {/* Secondary Inner Rim for added complexity */}
            <div className="absolute inset-2 md:inset-5 rounded-full border-t border-white/5 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] pointer-events-none"></div>

            {/* Recessed Play Surface - The "Bowl" */}
            <div className={`relative p-12 md:p-20 rounded-full ${theme.boardBg} ${theme.boardBorder} border border-white/10 shadow-[inset_0_50px_120px_rgba(0,0,0,1)] overflow-hidden`}
                 style={{ transform: 'translateZ(10px)' }}>
                
                {/* Surface Perforated Texture - Exactly matching user reference image */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay" style={{ backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.5) 1px, transparent 1px)`, backgroundSize: '12px 12px' }}></div>
                </div>
                
                {animatingMove && (
                  <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
                )}

                {/* The Peg Grid - Increased spacing for larger scale/circumference */}
                <div className="grid grid-cols-7 gap-12 md:gap-18 relative z-10" style={{ transformStyle: 'preserve-3d' }}>
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

                        if (isInvalid) return <div key={`${rIndex}-${cIndex}`} className="w-20 h-20 md:w-32 md:h-32" />;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            className="w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center relative pointer-events-auto"
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ transformStyle: 'preserve-3d', transform: 'translateZ(2px)' }}
                          >
                            {/* Deep Hole Styling - Increased size */}
                            <div className={`absolute w-19 h-19 md:w-31 md:h-31 rounded-full hole-3d transition-all duration-300 
                              ${isValidDestination ? 'bg-green-500/30 ring-4 ring-green-400/50 shadow-[0_0_50px_rgba(74,222,128,0.7)]' : ''}
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
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-green-400 shadow-[0_0_30px_#4ade80] animate-pulse"
                                     style={{ transform: 'translateZ(60px)' }}
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
