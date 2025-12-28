import React, { useMemo } from 'react';
import { Theme } from '../types';

interface MarbleProps {
  isSelected?: boolean;
  onClick?: () => void;
  isGhost?: boolean;
  isRemoving?: boolean;
  isNew?: boolean;
  theme: Theme;
  id: number; // Unique ID for deterministic pattern generation
}

export const Marble: React.FC<MarbleProps> = ({ isSelected, onClick, isGhost, isRemoving, isNew, theme, id }) => {
  const visualStyle = useMemo(() => {
    const seed = id * 12345 + (theme.isDark ? 99 : 1);
    const rnd = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const isGemTheme = theme.name === 'Gem Stones';
    const hueShift = isGemTheme 
        ? Math.floor(rnd(1) * 360) 
        : Math.floor(rnd(1) * 60) - 30;
    
    const rotation = Math.floor(rnd(2) * 360);
    
    const innerTexture = `
      radial-gradient(ellipse at 35% 65%, rgba(255,255,255,0.4) 0%, transparent 60%),
      linear-gradient(${rotation}deg, transparent 42%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.15) 52%, transparent 58%)
    `;

    return {
      filter: `hue-rotate(${hueShift}deg) contrast(1.1) saturate(1.15)`,
      pattern: innerTexture,
    };

  }, [id, theme.name, theme.isDark]);

  if (isGhost) {
     return (
        <div 
          className="w-13 h-13 md:w-23 md:h-23 rounded-full bg-black/50 transform scale-50 blur-[2px]"
        />
     )
  }

  return (
    <div
      onClick={onClick}
      className={`
        w-14 h-14 md:w-24 md:h-24 rounded-full cursor-pointer
        relative transition-all duration-300
        ${isRemoving ? 'scale-0 opacity-0 rotate-180 pointer-events-none' : ''}
        ${isNew ? 'marble-landed' : ''}
        ${isSelected ? `marble-selected ring-2 ring-white/50 ring-offset-4 ring-offset-transparent` : 'marble-3d hover:translate-y-[-10px]'}
      `}
      style={{
        background: `
          ${visualStyle.pattern},
          radial-gradient(circle at 35% 35%, ${theme.marbleStart} 0%, ${theme.marbleEnd} 85%, #000 100%)
        `,
        filter: visualStyle.filter,
        transformStyle: 'preserve-3d'
      }}
    >
      {/* 1. Sharp Specular Highlight */}
      <div className="absolute top-[12%] left-[14%] w-[18%] h-[12%] rounded-[50%] bg-white blur-[0.4px] shadow-[0_0_10px_rgba(255,255,255,1)] z-20"></div>
      
      {/* 2. Soft Secondary Glint */}
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[20%] rounded-[50%] bg-gradient-to-r from-white/50 to-transparent blur-[3px] z-10"></div>
      
      {/* 3. Subsurface Scattering / Internal Glow */}
      <div className="absolute bottom-[10%] right-[15%] w-[50%] h-[40%] rounded-full bg-gradient-to-tl from-white/20 to-transparent blur-[5px] opacity-100 mix-blend-overlay"></div>

      {/* 4. Bounce Light */}
      <div 
        className="absolute bottom-[2%] left-[20%] w-[60%] h-[20%] rounded-full opacity-60 blur-[4px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${theme.marbleEnd} 0%, transparent 80%)` }}
      ></div>

      {/* 5. Fresnel Rim Light */}
      <div className="absolute inset-0 rounded-full border border-white/25 pointer-events-none"></div>

      {/* 6. Dynamic Ambient Occlusion / Soft Shadow */}
      {(!isRemoving) && (
        <div 
          className={`
            absolute left-1/2 -translate-x-1/2 bg-black/70 blur-[6px] rounded-full pointer-events-none mix-blend-multiply transition-all duration-400
            ${isSelected ? 'bottom-[-70px] w-[100%] h-[28%] opacity-40 blur-[12px]' : 'bottom-[-5px] w-[90%] h-[18%] opacity-80'}
          `}
        ></div>
      )}
    </div>
  );
};