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
  disabled?: boolean;
}

export const Board: React.FC<BoardProps> = ({ 
  board, 
  selectedPos, 
  validMoves, 
  onCellClick, 
  theme,
  animatingMove,
  boardRef,
  disabled = false
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

  const boardSize = 'clamp(240px, min(85vw, 45vh), 500px)';

  return (
    <div className={`board-container-3d flex justify-center items-center relative w-full h-full pointer-events-none transition-all duration-700 ${disabled ? 'opacity-40' : 'opacity-100'}`} style={{ touchAction: 'none' }}>
      <div 
        ref={boardRef}
        className="relative rounded-full board-base pointer-events-none flex items-center justify-center p-0 shadow-[0_60px_120px_rgba(0,0,0,0.95),0_0_40px_rgba(0,0,0,0.5)]"
        style={{ 
          transformStyle: 'preserve-3d',
          width: boardSize,
          height: boardSize
        }}
      >
          {/* EXTERNAL ELEVATING FRAME */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#475569] via-[#1e293b] to-[#020617] border-b-[14px] border-black/95"
               style={{ transform: 'translateZ(-20px)' }}>
               <div className="absolute inset-0 rounded-full border-t-[3px] border-white/10"></div>
               {/* Ambient Occlusion shadow under the frame */}
               <div className="absolute inset-[-5%] rounded-full bg-black/40 blur-[40px] -z-10"></div>
          </div>
          
          {/* INNER RIM LIP */}
          <div className="absolute inset-[1.5%] rounded-full bg-gradient-to-br from-[#1e293b] via-black to-black shadow-2xl border-[1px] border-white/5"
               style={{ transform: 'translateZ(-5px)' }}></div>

          {/* MAIN PLAY SURFACE */}
          <div className={`relative w-[93%] h-[93%] rounded-full bg-gradient-to-br from-[#5a2a3e] to-[#1e0a14] shadow-[inset_0_15px_50px_rgba(0,0,0,0.95),0_5px_20px_rgba(0,0,0,0.6)] flex items-center justify-center p-[8%] overflow-hidden`}
               style={{ transform: 'translateZ(5px)' }}>
            
            {/* Subtle surface texture overlay for realism */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,#fff,transparent_70%)] pointer-events-none"></div>

            {animatingMove && (
              <MoveOverlay from={animatingMove.from} to={animatingMove.to} theme={theme} />
            )}

            {/* Main Game Grid Container */}
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
                        className={`w-full aspect-square rounded-full flex items-center justify-center relative ${disabled ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'}`}
                        onClick={() => !disabled && onCellClick({ row: rIndex, col: cIndex })}
                        style={{ transformStyle: 'preserve-3d', transform: 'translateZ(2px)' }}
                      >
                        {/* Hole Pits with improved Ambient Occlusion */}
                        <div className={`absolute w-[92%] h-[92%] rounded-full transition-all duration-500 bg-[#080808] 
                          shadow-[inset_0_4px_12px_rgba(0,0,0,1),inset_0_-2px_6px_rgba(255,255,255,0.05),0_1px_2px_rgba(255,255,255,0.05)]
                          ${isValidDestination ? 'ring-2 ring-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.8),inset_0_0_15px_rgba(52,211,153,0.3)]' : ''}
                        `}>
                          {/* Inner hole rim shadow for depth */}
                          <div className="absolute inset-0 rounded-full border-t-[1px] border-black/80"></div>
                        </div>

                        {hasMarble && !isAnimatingSource && (
                          <div className="relative z-10 w-[96%] h-[96%] flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                            <Marble 
                              id={rIndex * 7 + cIndex} 
                              isSelected={isSelected} 
                              theme={theme} 
                              isRemoving={isAnimatingMid}
                              isNew={isJustLanded && !animatingMove}
                            />
                          </div>
                        )}

                        {!disabled && isValidDestination && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[28%] h-[28%] rounded-full bg-emerald-400 shadow-[0_0_30px_#10b981,0_0_10px_#fff] animate-pulse"
                                 style={{ transform: 'translateZ(15px)' }}
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
