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
    // Increased bottom padding (pb-28) to ensure the bounding box covers the 3D projection of the bottom marbles
    <div className="board-container-3d flex justify-center pt-4 pb-28 relative pointer-events-none" style={{ touchAction: 'none' }}>
      
      {/* Decorative Glow behind the board */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-cyan-500/10 blur-[100px] rounded-full -z-10 transition-colors duration-1000 ${theme.isDark ? 'bg-cyan-500/10' : 'bg-blue-500/10'}`}></div>

      {/* The Board Structure with Dynamic Tilt via ref (App.tsx) */}
      <div 
        ref={boardRef}
        // Changed to pointer-events-none so the square bounding box doesn't block buttons behind it
        className={`
          relative p-3 md:p-5 rounded-full inline-block
          board-base pointer-events-none
          bg-gradient-to-b from-slate-700 to-slate-900
        `}
      >
          {/* Outer Rim Bezel (Chrome/Metal Finish) */}
          <div className={`
             rounded-full p-2 md:p-3
             bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800
             shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7),_inset_0_2px_4px_rgba(255,255,255,0.3),_0_0_0_1px_rgba(0,0,0,0.5)]
             border-b-4 border-slate-900/50
          `}>
            
            {/* The Main Playing Surface Container */}
            <div className={`
              relative p-6 md:p-8 rounded-full
              ${theme.boardBg} ${theme.boardBorder} border border-white/20
              shadow-[inset_0_20px_50px_rgba(0,0,0,0.9)]
            `}>
                {/* --- BACKGROUND LAYER (Clipped) --- */}
                {/* We move textures here so they stay inside the circle, while marbles can pop out */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
                    {/* Wet Surface Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent mix-blend-overlay"></div>
                    
                    {/* Texture */}
                    <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-multiply"></div>

                    {/* Inner Decorative Groove */}
                    <div className={`absolute inset-4 md:inset-5 rounded-full border opacity-30 ${theme.grooveBorder} shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]`}></div>
                </div>
                
                {/* Animation Overlay */}
                {animatingMove && (
                  <MoveOverlay 
                    from={animatingMove.from} 
                    to={animatingMove.to} 
                    theme={theme} 
                  />
                )}

                {/* --- GRID LAYER (Unclipped 3D) --- */}
                <div className="grid grid-cols-7 gap-2 md:gap-4 relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                  {board.map((row, rIndex) => (
                    <React.Fragment key={rIndex}>
                      {row.map((cell, cIndex) => {
                        const isInvalid = cell === CellState.INVALID;
                        const isSelected = selectedPos?.row === rIndex && selectedPos?.col === cIndex;
                        const hasMarble = cell === CellState.MARBLE;
                        
                        const isValidDestination = validMoves.some(m => m.row === rIndex && m.col === cIndex);

                        // Animation checks
                        const isAnimatingSource = animatingMove?.from.row === rIndex && animatingMove?.from.col === cIndex;
                        const isAnimatingMid = animatingMove?.mid.row === rIndex && animatingMove?.mid.col === cIndex;

                        if (isInvalid) {
                          return <div key={`${rIndex}-${cIndex}`} className="w-9 h-9 md:w-14 md:h-14" />;
                        }

                        // Unique ID for the marble based on position.
                        const marbleId = rIndex * 7 + cIndex;

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            id={`cell-${rIndex}-${cIndex}`}
                            // Added pointer-events-auto here so only the actual cells capture clicks
                            className={`
                              w-9 h-9 md:w-14 md:h-14 rounded-full flex items-center justify-center relative pointer-events-auto
                              ${(hasMarble || isValidDestination) ? 'cursor-pointer' : ''}
                            `}
                            onClick={() => onCellClick({ row: rIndex, col: cIndex })}
                            style={{ 
                                transformStyle: 'preserve-3d',
                                // Force GPU layer and slightly elevate touch target for easier hitting
                                transform: 'translateZ(1px)' 
                            }}
                          >
                            {/* The Hole (Deep Recessed) */}
                            <div className={`
                                absolute w-7 h-7 md:w-12 md:h-12 rounded-full hole-3d 
                                transition-all duration-300
                                ${isValidDestination ? 'bg-green-500/20 shadow-[inset_0_0_15px_rgba(74,222,128,0.5)] scale-110 ring-2 ring-green-400/50' : ''}
                            `}>
                                {/* Destination pulse */}
                                {isValidDestination && (
                                  <div className="absolute inset-0 rounded-full animate-pulse bg-green-400/20 box-border border border-green-400/50"></div>
                                )}
                            </div>

                            {/* The Marble */}
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
                            
                            {/* Destination Marker Guide - 3D Floating Dot */}
                            {isValidDestination && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-3 h-3 rounded-full bg-green-400 shadow-[0_0_15px_#4ade80] animate-bounce"
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