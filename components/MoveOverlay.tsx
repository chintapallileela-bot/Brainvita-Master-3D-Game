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
    zIndex: 100,
  });

  useEffect(() => {
    const fromEl = document.getElementById(`cell-${from.row}-${from.col}`);
    const toEl = document.getElementById(`cell-${to.row}-${to.col}`);

    if (fromEl && toEl) {
      const startX = fromEl.offsetLeft;
      const startY = fromEl.offsetTop;
      const endX = toEl.offsetLeft;
      const endY = toEl.offsetTop;

      setStyle({
        position: 'absolute',
        left: startX,
        top: startY,
        width: fromEl.offsetWidth,
        height: fromEl.offsetHeight,
        zIndex: 100,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: 'translate(0, 0) translateZ(80px)',
      });

      requestAnimationFrame(() => {
        setStyle(prev => ({
          ...prev,
          visibility: 'visible',
          transform: `translate(${endX - startX}px, ${endY - startY}px) translateZ(80px)`
        }));
      });
    }
  }, [from, to]);

  return (
    <div style={style}>
       <div className="transform scale-110">
         <Marble theme={theme} isSelected={true} id={from.row * 7 + from.col} /> 
       </div>
    </div>
  );
};