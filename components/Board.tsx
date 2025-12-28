
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
    <div className="board-container-3d flex justify-center items-center relative w-full h-full pointer-events-none" style={{ touchAction: 'none' }}>
      {/* Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] blur-[100px] sm:blur-[180px] rounded-full -z-10 opacity-30 ${theme.isDark ? 'bg-indigo-500/20' : 'bg-white/40'}`}></div>

      <div 
        ref={boardRef}
        className="relative w-[min(90vw,70vh)] aspect-square rounded-full board-base pointer-events-none bg-gradient-to-b from-slate-700 to-black p-4 sm:p-6 lg:p-8"
        style={{ transformStyle: 'preserve-3d' }}
      >
          {/* Bezel Rim */}
          <div className="w-full h-full rounded-full p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-slate-400 via-slate-900 to-black shadow-[0_30px_80px_rgba(0,0,0,1)] border-b-[8px] sm:border-b-[15px] border-black/90 relative"
               style={{ transform: 'translateZ(10px)' }}>
            
            {/* Surface Highlight */}
            <div className="absolute inset-0 rounded-full border-[1px] border-white/20 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-gradient-to-b from-white/10 to-transparent rotate-[-45deg]"></div>
            </div>
            
            {/* Play Surface Bowl */}
            <div className={`relative w-full h-full rounded-full ${theme.boardBg} ${theme.boardBorder} border border-white/5 shadow-[inset_0_20px_100px_rgba(0,0,0,1)] flex items-center justify-center p-[8%] overflow-hidden`}
                 style={{ transform: 'translateZ(15px)' }}>
                
                {/* Surface Fine Texture */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>
                
                {animatingMove && (
                  <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
                )}

                {/* Flexible Grid - Scales with parent */}
                <div className="grid grid-cols-7 gap-[2%] w-full h-full relative z-10" style={{ transformStyle: 'preserve-3d' }}>
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

                        if (isInvalid) return <div key={`${rIndex}-${cIndex}`} className="w-full aspect-square" />;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            className="w-full aspect-square rounded-full flex items-center justify-center relative pointer-events-auto cursor-pointer"
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ transformStyle: 'preserve-3d', transform: 'translateZ(2px)' }}
                          >
                            {/* Deep Hole - Responsive sizing */}
                            <div className={`absolute w-[95%] h-[95%] rounded-full hole-3d transition-all duration-300 
                              ${isValidDestination ? 'bg-green-500/20 ring-1 ring-green-400/40 shadow-[0_0_15px_rgba(74,222,128,0.5)]' : ''}
                            `}>
                                <div className="hole-rim-highlight"></div>
                            </div>

                            {hasMarble && !isAnimatingSource && (
                              <div className="relative z-10 w-[85%] h-[85%] flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
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
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[35%] h-[35%] rounded-full bg-green-400 shadow-[0_0_20px_#4ade80] animate-pulse"
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
