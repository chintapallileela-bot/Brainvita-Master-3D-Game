import React, { useMemo } from 'react';
import { Theme } from '../types';

interface MarbleProps {
  isSelected?: boolean;
  onClick?: () => void;
  isGhost?: boolean;
  isRemoving?: boolean;
  theme: Theme;
  id: number; // Unique ID for deterministic pattern generation
}

export const Marble: React.FC<MarbleProps> = ({ isSelected, onClick, isGhost, isRemoving, theme, id }) => {
  // Generate deterministic visual properties based on ID and Theme name
  const visualStyle = useMemo(() => {
    // Simple pseudo-random function
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
      radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 60%),
      linear-gradient(${rotation}deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)
    `;

    return {
      filter: `hue-rotate(${hueShift}deg)`,
      pattern: innerTexture,
    };

  }, [id, theme.name, theme.isDark]);

  if (isGhost) {
     return (
        <div 
          className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-black/20 transform scale-50 blur-[2px]"
        />
     )
  }

  return (
    <div
      onClick={onClick}
      className={`
        w-7 h-7 md:w-10 md:h-10 rounded-full cursor-pointer
        relative transition-all duration-300
        ${isRemoving ? 'scale-0 opacity-0 rotate-180' : ''}
        ${isSelected ? `marble-selected ring-4 ring-white/60 ring-offset-2 ring-offset-transparent` : 'marble-3d hover:translate-y-[-4px] hover:brightness-110'}
      `}
      style={{
        // High fidelity material stack
        background: `
          ${visualStyle.pattern},
          radial-gradient(circle at 35% 35%, ${theme.marbleStart} 0%, ${theme.marbleEnd} 90%, #020617 100%)
        `,
        filter: `${visualStyle.filter} contrast(1.15) saturate(1.1)`,
      }}
    >
      {/* --- Ray-traced Lighting Simulation --- */}

      {/* 1. Sharp Specular Highlight (Sun Reflection) - Crisp edges for "wet/glass" look */}
      <div className="absolute top-[15%] left-[18%] w-[12%] h-[8%] rounded-[50%] bg-white blur-[0.5px] shadow-[0_0_4px_rgba(255,255,255,0.9)] z-20"></div>
      
      {/* 2. Soft Secondary Glint */}
      <div className="absolute top-[12%] left-[25%] w-[30%] h-[15%] rounded-[50%] bg-gradient-to-r from-white/70 to-transparent blur-[1px] z-10"></div>
      
      {/* 3. Subsurface Scattering (Glow at the bottom opposite light) */}
      <div className="absolute bottom-[5%] right-[10%] w-[60%] h-[40%] rounded-full bg-gradient-to-tl from-white/20 to-transparent blur-[2px] opacity-90 mix-blend-overlay"></div>

      {/* 4. Fresnel Rim Light (Edges) - Thinner and sharper */}
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none"></div>

      {/* 5. Ambient Occlusion Cap - Darkens the very bottom where it touches the hole */}
      {!isSelected && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[20%] bg-black/40 blur-[2px] rounded-full pointer-events-none mix-blend-multiply"></div>
      )}

    </div>
  );
};