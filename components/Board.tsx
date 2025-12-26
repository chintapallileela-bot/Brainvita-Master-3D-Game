import React from 'react';
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
  boardRef: React.RefObject<HTMLDivElement>;
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
  return (
    <div className="board-container-3d flex justify-center pt-4 pb-32 relative pointer-events-none" style={{ touchAction: 'none' }}>
      
      {/* Dynamic Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-white/5 blur-[120px] rounded-full -z-10 transition-colors duration-1000 ${theme.isDark ? 'bg-indigo-500/10' : 'bg-blue-300/10'}`}></div>

      <div 
        ref={boardRef}
        className={`
          relative p-3 md:p-6 rounded-full inline-block
          board-base pointer-events-none
          bg-gradient-to-b from-slate-600 to-slate-900
        `}
      >
          {/* Outer Bezel (Brushed Metal look) */}
          <div className={`
             rounded-full p-2 md:p-4
             bg-gradient-to-br from-slate-300 via-slate-600 to-slate-900
             shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),_inset_0_2px_6px_rgba(255,255,255,0.4),_0_0_0_1px_rgba(0,0,0,0.6)]
             border-b-[6px] border-black/40
          `}>
            
            <div className={`
              relative p-6 md:p-10 rounded-full
              ${theme.boardBg} ${theme.boardBorder} border border-white/20
              shadow-[inset_0_25px_60px_rgba(0,0,0,0.95)]
            `}>
                {/* Board Surface Refinements */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent mix-blend-soft-light"></div>
                    <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] mix-blend-multiply"></div>
                    <div className={`absolute inset-5 md:inset-7 rounded-full border-2 opacity-20 ${theme.grooveBorder} shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)]`}></div>
                </div>
                
                {animatingMove && (
                  <MoveOverlay 
                    from={animatingMove.from} 
                    to={animatingMove.to} 
                    theme={theme} 
                  />
                )}

                <div className="grid grid-cols-7 gap-3 md:gap-5 relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                  {board.map((row, rIndex) => (
                    <React.Fragment key={rIndex}>
                      {row.map((cell, cIndex) => {
                        const isInvalid = cell === CellState.INVALID;
                        const isSelected = selectedPos?.row === rIndex && selectedPos?.col === cIndex;
                        const hasMarble = cell === CellState.MARBLE;
                        const isValidDestination = validMoves.some(m => m.row === rIndex && m.col === cIndex);

                        const isAnimatingSource = animatingMove?.from.row === rIndex && animatingMove?.from.col === cIndex;
                        const isAnimatingMid = animatingMove?.mid.row === rIndex && animatingMove?.mid.col === cIndex;

                        if (isInvalid) {
                          return <div key={`${rIndex}-${cIndex}`} className="w-9 h-9 md:w-16 md:h-16" />;
                        }

                        const marbleId = rIndex * 7 + cIndex;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            className={`
                              w-9 h-9 md:w-16 md:h-16 rounded-full flex items-center justify-center relative pointer-events-auto
                              ${(hasMarble || isValidDestination) ? 'cursor-pointer' : ''}
                            `}
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ 
                                transformStyle: 'preserve-3d',
                                transform: 'translateZ(2px)' 
                            }}
                          >
                            <div className={`
                                absolute w-8 h-8 md:w-13 md:h-13 rounded-full hole-3d 
                                transition-all duration-300
                                ${isValidDestination ? 'bg-green-500/30 shadow-[inset_0_0_20px_rgba(74,222,128,0.7)] scale-110 ring-2 ring-green-400' : ''}
                            `}>
                                {isValidDestination && (
                                  <div className="absolute inset-0 rounded-full animate-pulse bg-green-400/30 box-border border border-green-400"></div>
                                )}
                            </div>

                            {hasMarble && !isAnimatingSource && (
                              <div className="relative z-10 transition-transform duration-200" style={{ transformStyle: 'preserve-3d' }}>
                                <Marble 
                                  id={marbleId}
                                  isSelected={isSelected} 
                                  theme={theme} 
                                  isRemoving={isAnimatingMid}
                                />
                              </div>
                            )}
                            
                            {isValidDestination && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-4 h-4 rounded-full bg-green-400 shadow-[0_0_20px_#4ade80] animate-bounce"
                                     style={{ transform: 'translateZ(40px)' }}
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