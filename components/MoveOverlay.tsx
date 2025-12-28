import React, { useEffect, useState } from 'react';
import { Position, Theme } from '../types';
import { Marble } from './Marble';

interface MoveOverlayProps {
  from: Position;
  to: Position;
  theme: Theme;
}

export const MoveOverlay: React.FC<MoveOverlayProps> = ({ from, to, theme }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    visibility: 'hidden',
    zIndex: 50,
  });

  useEffect(() => {
    const fromEl = document.getElementById(`cell-${from.row}-${from.col}`);
    const toEl = document.getElementById(`cell-${to.row}-${to.col}`);

    if (fromEl && toEl) {
      const startLeft = fromEl.offsetLeft;
      const startTop = fromEl.offsetTop;
      
      const endLeft = toEl.offsetLeft;
      const endTop = toEl.offsetTop;

      setStyle({
        position: 'absolute',
        left: startLeft,
        top: startTop,
        width: fromEl.offsetWidth,
        height: fromEl.offsetHeight,
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
        transform: 'translate(0, 0) translateZ(80px) scale(1.1)', 
      });

      requestAnimationFrame(() => {
        setStyle(prev => ({
          ...prev,
          visibility: 'visible',
          transform: `translate(${endLeft - startLeft}px, ${endTop - startTop}px) translateZ(80px) scale(1.1)`
        }));
      });
    }
  }, [from, to]);

  const marbleId = from.row * 7 + from.col;

  return (
    <div style={style}>
       <div className="w-full h-full flex items-center justify-center transform shadow-[0_30px_50px_rgba(0,0,0,0.6)] rounded-full" style={{ transformStyle: 'preserve-3d' }}>
         <Marble theme={theme} isSelected={true} id={marbleId} /> 
       </div>
    </div>
  );
};