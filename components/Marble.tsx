
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
    const seed = id * 12345 + (theme.isDark ? 99 : 1);
    const rnd = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const isGemTheme = theme.name === 'Gem Stones';
    const hueShift = isGemTheme ? Math.floor(rnd(1) * 360) : Math.floor(rnd(1) * 60) - 30;
    const rotation = Math.floor(rnd(2) * 360);
    const innerTexture = `
      radial-gradient(ellipse at 35% 65%, rgba(255,255,255,0.4) 0%, transparent 60%),
      linear-gradient(${rotation}deg, transparent 42%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 52%, transparent 58%)
    `;

    return {
      filter: `hue-rotate(${hueShift}deg) contrast(1.1) saturate(1.15)`,
      pattern: innerTexture,
    };
  }, [id, theme.name, theme.isDark]);

  if (isGhost) {
     return <div className="w-full h-full rounded-full bg-black/50 transform scale-50 blur-[2px]" />;
  }

  return (
    <div
      onClick={onClick}
      className={`
        w-[90%] h-[90%] rounded-full cursor-pointer
        relative transition-all duration-300
        ${isRemoving ? 'scale-0 opacity-0 rotate-180 pointer-events-none' : ''}
        ${isNew ? 'marble-landed' : ''}
        ${isSelected ? `marble-selected ring-2 ring-white/50 ring-offset-4 ring-offset-transparent` : 'marble-3d hover:translate-y-[-12%]'}
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
      <div className="absolute top-[12%] left-[14%] w-[18%] h-[12%] rounded-[50%] bg-white blur-[0.3px] shadow-[0_0_8px_rgba(255,255,255,1)] z-20"></div>
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[20%] rounded-[50%] bg-gradient-to-r from-white/50 to-transparent blur-[2px] z-10"></div>
      <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none"></div>
      {(!isRemoving) && (
        <div 
          className={`
            absolute left-1/2 -translate-x-1/2 bg-black/70 blur-[8px] rounded-full pointer-events-none mix-blend-multiply transition-all duration-400
            ${isSelected ? 'bottom-[-60%] w-[95%] h-[25%] opacity-40 blur-[15px]' : 'bottom-[-6%] w-[85%] h-[15%] opacity-80'}
          `}
        ></div>
      )}
    </div>
  );
};
