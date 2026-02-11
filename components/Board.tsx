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

  // Sizing refined to handle various orientations
  const boardSize = 'clamp(240px, min(85vw, 45vh), 500px)';

  return (
    <div className={`board-container-3d flex justify-center items-center relative w-full h-full pointer-events-none transition-all duration-700 ${disabled ? 'opacity-40' : 'opacity-100'}`} style={{ touchAction: 'none' }}>
      <div 
        ref={boardRef}
        className="relative rounded-full board-base pointer-events-none flex items-center justify-center p-0 shadow-[0_50px_100px_rgba(0,0,0,0.95)]"
        style={{ 
          transformStyle: 'preserve-3d',
          width: boardSize,
          height: boardSize
        }}
      >
          {/* EXTERNAL ELEVATING FRAME - Dark Metallic Plastic Look */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#475569] via-[#1e293b] to-[#020617] border-b-[12px] border-black/90"
               style={{ transform: 'translateZ(-15px)' }}>
               {/* Specular Rim Light */}
               <div className="absolute inset-0 rounded-full border-t-[2px] border-white/10"></div>
          </div>
          
          {/* INNER RIM - The "Lip" that holds the play surface */}
          <div className="absolute inset-[2%] rounded-full bg-gradient-to-br from-[#1e293b] to-black shadow-2xl border-[1px] border-white/5"
               style={{ transform: 'translateZ(-2px)' }}></div>

          {/* MAIN PLAY SURFACE - Recessed with Deep Plum Gradient */}
          <div className={`relative w-[92%] h-[92%] rounded-full bg-gradient-to-br from-[#5a2a3e] to-[#240e18] shadow-[inset_0_10px_40px_rgba(0,0,0,0.9),0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center p-[8%] overflow-hidden`}
               style={{ transform: 'translateZ(5px)' }}>
            
            {/* The horizontal gloss line was removed here as requested */}

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
                        {/* Hole Pits - Deep matte black */}
                        <div className={`absolute w-[90%] h-[90%] rounded-full transition-all duration-300 bg-[#0a0a0a] shadow-[inset_0_3px_8px_rgba(0,0,0,1),0_1px_1px_rgba(255,255,255,0.08)]
                          ${isValidDestination ? 'ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.7)]' : ''}
                        `}>
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
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[30%] h-[30%] rounded-full bg-emerald-400 shadow-[0_0_25px_#10b981] animate-pulse"
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
  );
};
