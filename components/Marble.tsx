import React, { useMemo } from 'react';
import { Theme } from '../types';

interface MarbleProps {
  isSelected?: boolean;
  onClick?: () => void;
  isGhost?: boolean;
  isRemoving?: boolean;
  isNew?: boolean;
  theme: Theme;
  id: number;
}

export const Marble: React.FC<MarbleProps> = ({ isSelected, onClick, isGhost, isRemoving, isNew, theme, id }) => {
  const visualStyle = useMemo(() => {
    // We want a consistent look that matches the image, but with subtle variety
    const seed = id * 12345;
    const rnd = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const hueShift = Math.floor(rnd(1) * 10) - 5; // Very subtle shift
    
    // Gradient that mimics the image's metallic plum look
    const marbleGradient = `radial-gradient(circle at 35% 35%, #926d83 0%, #4a243b 60%, #1e0b16 100%)`;

    return {
      filter: `hue-rotate(${hueShift}deg) contrast(1.1) saturate(1.1)`,
      gradient: marbleGradient,
    };
  }, [id]);

  if (isGhost) {
     return <div className="w-full h-full rounded-full bg-black/60 transform scale-50 blur-[2px]" />;
  }

  return (
    <div
      onClick={onClick}
      className={`
        w-full h-full rounded-full cursor-pointer
        relative transition-all duration-300
        ${isRemoving ? 'scale-0 opacity-0 rotate-180 pointer-events-none' : ''}
        ${isNew ? 'marble-landed' : ''}
        ${isSelected ? `marble-selected ring-2 ring-white/70 ring-offset-2 ring-offset-[#4a243b]` : 'hover:translate-y-[-10%] shadow-2xl'}
      `}
      style={{
        background: visualStyle.gradient,
        filter: visualStyle.filter,
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Sharp Specular Highlight like in the image */}
      <div className="absolute top-[12%] left-[16%] w-[25%] h-[20%] rounded-[50%] bg-white/70 blur-[0.8px] shadow-[0_0_5px_rgba(255,255,255,0.8)] z-20"></div>
      
      {/* Secondary Soft Shine */}
      <div className="absolute top-[8%] left-[25%] w-[40%] h-[30%] rounded-[50%] bg-gradient-to-r from-white/20 to-transparent blur-[3px] z-10"></div>
      
      {/* Outer Border Rim for better definition */}
      <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none"></div>
      
      {(!isRemoving) && (
        <div 
          className={`
            absolute left-1/2 -translate-x-1/2 bg-black/80 blur-[6px] rounded-full pointer-events-none mix-blend-multiply transition-all duration-400
            ${isSelected ? 'bottom-[-40%] w-[90%] h-[20%] opacity-30 blur-[15px]' : 'bottom-[-5%] w-[85%] h-[15%] opacity-60'}
          `}
        ></div>
      )}
    </div>
  );
};
