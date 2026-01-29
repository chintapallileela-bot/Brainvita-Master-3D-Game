
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

  // Adjusted clamp to ensure it fits better between header and footer
  // Changed 65vh to 45vh to prevent vertical overlap on mobile
  const boardSize = 'clamp(260px, min(82vw, 45vh), 480px)';

  return (
    <div className="board-container-3d flex justify-center items-center relative w-full h-full pointer-events-none" style={{ touchAction: 'none' }}>
      {/* Dynamic Aura Glow based on theme brightness */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] blur-[120px] rounded-full -z-10 transition-all duration-1000 ${theme.isDark ? 'bg-indigo-500/10' : 'bg-white/30'} opacity-40`}></div>

      <div 
        ref={boardRef}
        className="relative rounded-full board-base pointer-events-none flex items-center justify-center p-4"
        style={{ 
          transformStyle: 'preserve-3d',
          width: boardSize,
          height: boardSize
        }}
      >
          {/* External Thick Wood/Stone Bezel */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-400 via-slate-800 to-black shadow-[0_40px_100px_rgba(0,0,0,0.9)] border-b-[12px] border-black/90"
               style={{ transform: 'translateZ(-5px)' }}></div>
          
          {/* Play Surface Housing */}
          <div className={`relative w-full h-full rounded-full ${theme.boardBg} ${theme.boardBorder} border-2 shadow-[inset_0_20px_80px_rgba(0,0,0,1),0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center p-[8%] overflow-hidden`}
               style={{ transform: 'translateZ(10px)' }}>
            
            {/* Fine Texture Overlay */}
            <div className="absolute inset-0 rounded-full opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] pointer-events-none"></div>
            
            {animatingMove && (
              <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
            )}

            {/* Main Game Grid */}
            <div className="grid grid-cols-7 gap-[2.5%] w-full h-full relative z-10" style={{ transformStyle: 'preserve-3d' }}>
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
                        {/* Recursive Indented Hole Visual */}
                        <div className={`absolute w-[92%] h-[92%] rounded-full transition-all duration-300 ${theme.holeBg} 
                          shadow-[inset_4px_6px_12px_rgba(0,0,0,1),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]
                          ${isValidDestination ? 'ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] bg-emerald-900/20' : ''}
                        `}>
                            <div className="absolute inset-[-1px] rounded-full border border-white/5 pointer-events-none"></div>
                        </div>

                        {hasMarble && !isAnimatingSource && (
                          <div className="relative z-10 w-[82%] h-[82%] flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
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
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[30%] h-[30%] rounded-full bg-emerald-400 shadow-[0_0_25px_#10b981] animate-pulse"
                                 style={{ transform: 'translateZ(25px)' }}
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
  );
};
