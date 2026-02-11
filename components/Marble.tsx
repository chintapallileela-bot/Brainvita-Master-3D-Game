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
    const seed = id * 12345;
    const rnd = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const isGemTheme = theme.name === 'Gem Stones';
    
    // For Gem Stones, we want a full spectrum of colors.
    // For other themes, we keep a very subtle shift for a natural/organic look.
    const hueShift = isGemTheme 
      ? Math.floor(rnd(1) * 360) 
      : Math.floor(rnd(1) * 4) - 2;
    
    /**
     * Multi-layer gradient for volume:
     * - Top light: Theme's marbleStart
     * - Mid body: Theme's marbleEnd
     * - Bottom base: Deep shade of black/darkness for spherical depth
     */
    const marbleGradient = `
      radial-gradient(circle at 35% 30%, ${theme.marbleStart} 0%, ${theme.marbleEnd} 55%, #050505 100%)
    `;

    return {
      filter: `hue-rotate(${hueShift}deg) contrast(${isGemTheme ? '1.2' : '1.1'}) saturate(${isGemTheme ? '1.4' : '1.2'})`,
      gradient: marbleGradient,
    };
  }, [id, theme.marbleStart, theme.marbleEnd, theme.name]);

  if (isGhost) {
     return <div className="w-full h-full rounded-full bg-black/70 transform scale-50 blur-[3px]" />;
  }

  return (
    <div
      onClick={onClick}
      className={`
        w-full h-full rounded-full cursor-pointer
        relative transition-all duration-300
        ${isRemoving ? 'scale-0 opacity-0 rotate-180 pointer-events-none' : ''}
        ${isNew ? 'marble-landed' : ''}
        ${isSelected ? `marble-selected ring-[3px] ring-white/90 ring-offset-4 ring-offset-transparent shadow-[0_40px_60px_rgba(0,0,0,0.8)]` : 'hover:translate-y-[-12%] shadow-[0_15px_30px_rgba(0,0,0,0.7)]'}
      `}
      style={{
        background: visualStyle.gradient,
        filter: visualStyle.filter,
        transformStyle: 'preserve-3d'
      }}
    >
      {/* High-frequency primary specular highlight */}
      <div className="absolute top-[12%] left-[16%] w-[24%] h-[20%] rounded-[50%] bg-white/95 blur-[0.4px] shadow-[0_0_12px_rgba(255,255,255,1)] z-30"></div>
      
      {/* Secondary soft gloss wash */}
      <div className="absolute top-[8%] left-[22%] w-[45%] h-[35%] rounded-[50%] bg-gradient-to-br from-white/30 to-transparent blur-[4px] z-20"></div>
      
      {/* Bottom bounce light reflection (simulating light reflecting from the board surface back onto the marble) */}
      <div 
        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[70%] h-[25%] rounded-full blur-[3px] z-10 opacity-40"
        style={{ background: `linear-gradient(to top, ${theme.marbleStart}, transparent)` }}
      ></div>
      
      {/* Outer rim definition */}
      <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none z-40"></div>
      
      {(!isRemoving) && (
        <>
          {/* Main drop shadow */}
          <div 
            className={`
              absolute left-1/2 -translate-x-1/2 bg-black/90 blur-[8px] rounded-full pointer-events-none mix-blend-multiply transition-all duration-400
              ${isSelected ? 'bottom-[-50%] w-[100%] h-[25%] opacity-40 blur-[20px]' : 'bottom-[-6%] w-[90%] h-[18%] opacity-80'}
            `}
          ></div>
          
          {/* Sharp Ambient Occlusion shadow at base contact point */}
          {!isSelected && (
            <div className="absolute bottom-[-2%] left-1/2 -translate-x-1/2 w-[80%] h-[10%] bg-black blur-[2px] rounded-full pointer-events-none mix-blend-multiply opacity-100"></div>
          )}
        </>
      )}
    </div>
  );
};
