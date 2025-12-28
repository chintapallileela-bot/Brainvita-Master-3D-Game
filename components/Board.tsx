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
    <div className="board-container-3d flex justify-center relative">
      <div 
        ref={boardRef}
        className="relative p-12 md:p-14 rounded-full inline-block board-base bg-gradient-to-b from-slate-700 to-slate-950"
        style={{ transformStyle: 'preserve-3d' }}
      >
          {/* Main Disc - Perfect Circle with Bezel */}
          <div className="aspect-square rounded-full p-8 md:p-10 bg-gradient-to-br from-slate-400 via-slate-700 to-slate-900 shadow-[0_45px_100px_rgba(0,0,0,0.8)] border-b-[15px] border-black/90 relative"
               style={{ transform: 'translateZ(10px)' }}>
            
            {/* Glossy Edge Rim */}
            <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none"></div>

            {/* Inset Play Surface */}
            <div className={`relative aspect-square p-12 md:p-16 rounded-full ${theme.boardBg} ${theme.boardBorder} border-2 border-white/20 shadow-[inset_0_40px_100px_rgba(0,0,0,0.8)]`}
                 style={{ transform: 'translateZ(5px)' }}>
                
                {/* Surface Grain Texture */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-5">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>
                
                {animatingMove && (
                  <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
                )}

                <div className="grid grid-cols-7 gap-6 md:gap-10 relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                  {board.map((row, rIndex) => (
                    <React.Fragment key={rIndex}>
                      {row.map((cell, cIndex) => {
                        const isInvalid = cell === CellState.INVALID;
                        const isSelected = selectedPos?.row === rIndex && selectedPos?.col === cIndex;
                        const hasMarble = cell === CellState.MARBLE;
                        const isValidDestination = validMoves.some(m => m.row === rIndex && m.col === cIndex);
                        const isAnimatingSource = animatingMove?.from.row === rIndex && animatingMove?.from.col === cIndex;
                        const isAnimatingMid = animatingMove?.mid.row === rIndex && animatingMove?.mid.col === cIndex;

                        if (isInvalid) return <div key={`${rIndex}-${cIndex}`} className="w-16 h-16 md:w-24 md:h-24" />;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            className="w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center relative pointer-events-auto"
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            <div className={`absolute w-[95%] h-[95%] rounded-full hole-3d transition-all duration-300 
                              ${isValidDestination ? 'ring-4 ring-green-400 shadow-[0_0_40px_rgba(74,222,128,0.6)] bg-green-950/20' : ''}
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
                                />
                              </div>
                            )}

                            {isValidDestination && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                    <div className="w-6 h-6 rounded-full bg-green-400 shadow-[0_0_20px_#4ade80] animate-pulse"></div>
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