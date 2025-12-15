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
      // Because this component is rendered INSIDE the board container (which is `relative`),
      // we can use offsetLeft/offsetTop to position strictly relative to the board grid.
      // This is robust against 3D transforms on the parent.
      
      const startLeft = fromEl.offsetLeft;
      const startTop = fromEl.offsetTop;
      
      const endLeft = toEl.offsetLeft;
      const endTop = toEl.offsetTop;

      // Set initial position
      setStyle({
        position: 'absolute', // Absolute relative to the grid container
        left: startLeft,
        top: startTop,
        width: fromEl.offsetWidth, // Match cell width
        height: fromEl.offsetHeight,
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)', // Smooth ease-out, faster (150ms)
        transform: 'translate(0, 0) translateZ(50px)', // Start slightly elevated in Z
      });

      // Trigger animation in next frame
      requestAnimationFrame(() => {
        setStyle(prev => ({
          ...prev,
          visibility: 'visible',
          // Translate to the destination offset relative to start
          transform: `translate(${endLeft - startLeft}px, ${endTop - startTop}px) translateZ(50px)`
        }));
      });
    }
  }, [from, to]);

  // Determine seed ID based on 'from' position to match the marble that was there
  const marbleId = from.row * 7 + from.col;

  return (
    <div style={style}>
       <div className="transform scale-110 shadow-2xl rounded-full" style={{ transformStyle: 'preserve-3d' }}>
         <Marble theme={theme} isSelected={true} id={marbleId} /> 
       </div>
    </div>
  );
};