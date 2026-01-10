
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
   * Enforced a strict aspect-square by defining synchronized width and height.
   * Increased min-height to ensure the board doesn't collapse on mobile.
   */
  const boardSize = 'clamp(300px, min(85vw, 45vh), 420px)';

  const boardGlowClass = theme.isDark 
    ? 'bg-indigo-500/20 shadow-[0_0_80px_rgba(99,102,241,0.25)]' 
    : 'bg-white/40 shadow-[0_0_80px_rgba(255,255,255,0.3)]';

  return (
    <div className="board-container-3d flex justify-center items-center relative pointer-events-none mb-4" style={{ touchAction: 'none' }}>
      {/* Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] blur-[60px] rounded-full -z-10 transition-all duration-700 ${boardGlowClass}`}></div>

      <div 
        ref={boardRef}
        className="relative rounded-full board-base pointer-events-none bg-gradient-to-b from-slate-700 via-slate-800 to-black p-2 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
        style={{ 
          transformStyle: 'preserve-3d',
          width: boardSize,
          height: boardSize
        }}
      >
          {/* Bezel Rim */}
          <div className="w-full h-full rounded-full p-2 bg-gradient-to-br from-slate-400 via-slate-900 to-black border-b-[6px] sm:border-b-[10px] border-black/95 relative"
               style={{ transform: 'translateZ(10px)' }}>
            
            {/* Play Surface Bowl */}
            <div className={`relative w-full h-full rounded-full ${theme.boardBg} ${theme.boardBorder} border border-white/10 shadow-[inset_0_10px_40px_rgba(0,0,0,0.9)] flex items-center justify-center p-[15%] overflow-hidden`}
                 style={{ transform: 'translateZ(15px)' }}>
                
                {/* Surface Fine Texture */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>
                
                {animatingMove && (
                  <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
                )}

                {/* Grid */}
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

                        if (isInvalid) return <div key={`${rIndex}-${cIndex}`} className="w-full h-full" />;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            className="w-full aspect-square rounded-full flex items-center justify-center relative pointer-events-auto cursor-pointer"
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ transformStyle: 'preserve-3d', transform: 'translateZ(2px)' }}
                          >
                            <div className={`absolute w-[95%] h-[95%] rounded-full hole-3d transition-all duration-300 
                              ${isValidDestination ? 'bg-green-500/20 ring-2 ring-green-400/40 shadow-[0_0_10px_rgba(74,222,128,0.4)]' : ''}
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
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[20%] h-[20%] rounded-full animate-pulse bg-green-400 shadow-[0_0_12px_#4ade80]`}
                                     style={{ transform: 'translateZ(20px)' }}
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
