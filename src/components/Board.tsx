
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

  /**
   * Enforced a strict 1:1 aspect ratio.
   * Reduced vh to 25% to guarantee a perfectly round circle on shorter screens.
   */
  const boardSize = 'min(70vw, 25vh, 240px)';

  return (
    <div className="board-container-3d flex justify-center items-center relative pointer-events-none flex-shrink-0" style={{ touchAction: 'none' }}>
      {/* Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] blur-[40px] rounded-full -z-10 opacity-20 ${theme.isDark ? 'bg-indigo-500/20' : 'bg-white/30'}`}></div>

      <div 
        ref={boardRef}
        className="relative rounded-full board-base pointer-events-none bg-gradient-to-b from-slate-700 to-black p-1 flex-shrink-0 shadow-2xl aspect-square"
        style={{ 
          transformStyle: 'preserve-3d',
          width: boardSize,
          height: boardSize
        }}
      >
          {/* Bezel Rim */}
          <div className="w-full h-full rounded-full p-1 bg-gradient-to-br from-slate-400 via-slate-900 to-black shadow-[0_10px_25px_rgba(0,0,0,1)] border-b-[2px] sm:border-b-[4px] border-black/95 relative"
               style={{ transform: 'translateZ(5px)' }}>
            
            {/* Play Surface Bowl - Maximum padding to keep marbles centered and round */}
            <div className={`relative w-full h-full rounded-full ${theme.boardBg} ${theme.boardBorder} border border-white/5 shadow-[inset_0_5px_25px_rgba(0,0,0,1)] flex items-center justify-center p-[18%] overflow-hidden`}
                 style={{ transform: 'translateZ(8px)' }}>
                
                {/* Surface Fine Texture */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 opacity-[0.01] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>
                
                {animatingMove && (
                  <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
                )}

                {/* Grid */}
                <div className="grid grid-cols-7 gap-[1%] w-full h-full relative z-10" style={{ transformStyle: 'preserve-3d' }}>
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
                            style={{ transformStyle: 'preserve-3d', transform: 'translateZ(1px)' }}
                          >
                            <div className={`absolute w-[95%] h-[95%] rounded-full hole-3d transition-all duration-300 
                              ${isValidDestination ? 'bg-green-500/10 ring-1 ring-green-400/20 shadow-[0_0_3px_rgba(74,222,128,0.2)]' : ''}
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
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[18%] h-[18%] rounded-full bg-green-400 shadow-[0_0_6px_#4ade80] animate-pulse"
                                     style={{ transform: 'translateZ(12px)' }}
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
