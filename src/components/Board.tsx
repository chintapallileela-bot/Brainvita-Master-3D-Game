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
  return (
    <div className="board-container-3d flex justify-center relative pointer-events-none" style={{ touchAction: 'none' }}>
      <div 
        ref={boardRef}
        className="relative p-1.5 md:p-4 rounded-full inline-block board-base pointer-events-none bg-gradient-to-b from-slate-600 to-slate-900"
      >
          {/* Outer Bezel (Brushed Metal look) */}
          <div className="rounded-full p-1 md:p-3 bg-gradient-to-br from-slate-300 via-slate-600 to-slate-900 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.9)] border-b-[3px] border-black/40">
            
            <div className={`relative p-3 md:p-6 rounded-full ${theme.boardBg} ${theme.boardBorder} border border-white/20 shadow-[inset_0_15px_40px_rgba(0,0,0,0.95)]`}>
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] mix-blend-multiply"></div>
                    <div className={`absolute inset-2 md:inset-5 rounded-full border opacity-20 ${theme.grooveBorder}`}></div>
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

                        if (isInvalid) return <div key={`${rIndex}-${cIndex}`} className="w-8 h-8 md:w-16 md:h-16" />;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            className="w-8 h-8 md:w-16 md:h-16 rounded-full flex items-center justify-center relative pointer-events-auto"
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ transformStyle: 'preserve-3d', transform: 'translateZ(1px)' }}
                          >
                            <div className={`absolute w-7 h-7 md:w-13 md:h-13 rounded-full hole-3d transition-all ${isValidDestination ? 'bg-green-500/30 scale-110 ring-2 ring-green-400' : ''}`} />
                            {hasMarble && !isAnimatingSource && (
                              <div className="relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                                <Marble id={rIndex * 7 + cIndex} isSelected={isSelected} theme={theme} isRemoving={isAnimatingMid} />
                              </div>
                            )}
                            {isValidDestination && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80] animate-bounce" style={{ transform: 'translateZ(20px)' }} />
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