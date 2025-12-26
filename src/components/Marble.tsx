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
    // Increased hue range for high contrast "gem" designs
    const hueShift = isGemTheme 
        ? Math.floor(rnd(1) * 360) 
        : Math.floor(rnd(1) * 80) - 40;
    
    const rotation = Math.floor(rnd(2) * 360);
    
    // Increased opacity in swirls to ensure "design" is seen
    const innerTexture = `
      radial-gradient(ellipse at 35% 65%, rgba(255,255,255,0.5) 0%, transparent 70%),
      linear-gradient(${rotation}deg, transparent 40%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.2) 55%, transparent 60%)
    `;

    return {
      filter: `hue-rotate(${hueShift}deg) contrast(1.1) brightness(1.1)`,
      pattern: innerTexture,
    };

  }, [id, theme.name, theme.isDark]);

  if (isGhost) {
     return (
        <div 
          className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-black/40 transform scale-50 blur-[2px]"
        />
     )
  }

  return (
    <div
      onClick={onClick}
      className={`
        w-8 h-8 md:w-11 md:h-11 rounded-full cursor-pointer
        relative transition-all duration-300
        ${isRemoving ? 'scale-0 opacity-0 rotate-180' : ''}
        ${isSelected ? `marble-selected ring-4 ring-white/70 ring-offset-2 ring-offset-transparent` : 'marble-3d hover:translate-y-[-6px] hover:brightness-110'}
      `}
      style={{
        // High fidelity material stack
        background: `
          ${visualStyle.pattern},
          radial-gradient(circle at 35% 35%, ${theme.marbleStart} 0%, ${theme.marbleEnd} 85%, #000 100%)
        `,
        filter: visualStyle.filter,
      }}
    >
      {/* --- Ray-traced Lighting Simulation --- */}

      {/* 1. Sharp Specular Highlight (High Gloss Reflection) */}
      <div className="absolute top-[12%] left-[15%] w-[15%] h-[10%] rounded-[50%] bg-white blur-[0.2px] shadow-[0_0_6px_rgba(255,255,255,1)] z-20"></div>
      
      {/* 2. Soft Secondary Glint (Larger Surface) */}
      <div className="absolute top-[8%] left-[22%] w-[35%] h-[18%] rounded-[50%] bg-gradient-to-r from-white/60 to-transparent blur-[2px] z-10"></div>
      
      {/* 3. Subsurface Scattering (Internal Glow) */}
      <div className="absolute bottom-[8%] right-[12%] w-[55%] h-[35%] rounded-full bg-gradient-to-tl from-white/30 to-transparent blur-[3px] opacity-100 mix-blend-overlay"></div>

      {/* 4. Extra Crisp Fresnel Rim Light */}
      <div className="absolute inset-0 rounded-full border border-white/30 pointer-events-none"></div>
      <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none"></div>

      {/* 5. Ambient Occlusion Mask */}
      {!isSelected && (
        <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-[85%] h-[20%] bg-black/60 blur-[3px] rounded-full pointer-events-none mix-blend-multiply"></div>
      )}

    </div>
  );
};