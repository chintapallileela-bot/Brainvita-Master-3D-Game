
import { Theme, GameLayout } from './types';

export const BOARD_SIZE = 7;

// Helper to create the board grid easily
const I = -1; // Invalid
const O = 1;  // Marble
const E = 0;  // Empty

export const LAYOUTS: GameLayout[] = [
  {
    name: "Circular Board",
    description: "37 holes. The classic round layout.",
    board: [
      [I, I, O, O, O, I, I],
      [I, O, O, O, O, O, I],
      [O, O, O, O, O, O, O],
      [O, O, O, E, O, O, O],
      [O, O, O, O, O, O, O],
      [I, O, O, O, O, O, I],
      [I, I, O, O, O, I, I],
    ]
  },
  {
    name: "Classic Cross",
    description: "The standard 33-hole English board.",
    board: [
      [I, I, O, O, O, I, I],
      [I, I, O, O, O, I, I],
      [O, O, O, O, O, O, O],
      [O, O, O, E, O, O, O],
      [O, O, O, O, O, O, O],
      [I, I, O, O, O, I, I],
      [I, I, O, O, O, I, I],
    ]
  },
  {
    name: "Triangle",
    description: "A sharp peak formation.",
    board: [
      [I, I, I, O, I, I, I],
      [I, I, O, O, O, I, I],
      [I, O, O, O, O, O, I],
      [O, O, O, E, O, O, O],
      [O, O, O, O, O, O, O],
      [I, I, I, I, I, I, I],
      [I, I, I, I, I, I, I],
    ]
  },
  {
    name: "Hourglass",
    description: "Wide edges meeting at a single point.",
    board: [
      [O, O, O, O, O, O, O],
      [I, O, O, O, O, O, I],
      [I, I, O, O, O, I, I],
      [I, I, I, E, I, I, I],
      [I, I, O, O, O, I, I],
      [I, O, O, O, O, O, I],
      [O, O, O, O, O, O, O],
    ]
  },
  {
    name: "Flag",
    description: "A rectangular banner with a pole.",
    board: [
      [O, O, O, O, O, I, I],
      [O, O, O, O, O, I, I],
      [O, O, E, O, O, I, I],
      [O, O, O, O, O, I, I],
      [I, O, I, I, I, I, I],
      [I, O, I, I, I, I, I],
      [I, O, I, I, I, I, I],
    ]
  },
  {
    name: "Heart",
    description: "A lovely but challenging layout.",
    board: [
      [I, O, O, I, O, O, I],
      [O, O, O, O, O, O, O],
      [O, O, O, E, O, O, O],
      [O, O, O, O, O, O, O],
      [I, O, O, O, O, O, I],
      [I, I, O, O, O, I, I],
      [I, I, I, O, I, I, I],
    ]
  },
  {
    name: "Pyramid",
    description: "Triangle formation on the Classic board.",
    board: [
      [I, I, E, O, E, I, I],
      [I, I, E, O, O, I, I],
      [E, E, E, O, O, O, E],
      [E, E, E, O, O, O, O],
      [E, E, E, E, E, E, E],
      [I, I, E, E, E, I, I],
      [I, I, E, E, E, I, I],
    ]
  },
  {
    name: "Diamond",
    description: "A sharp diamond shape.",
    board: [
      [I, I, E, O, E, I, I],
      [I, I, O, O, O, I, I],
      [E, O, O, O, O, O, E],
      [O, O, O, E, O, O, O],
      [E, O, O, O, O, O, E],
      [I, I, O, O, O, I, I],
      [I, I, E, O, E, I, I],
    ]
  }
];

export const THEMES: Theme[] = [
  {
    name: 'Barbie World',
    isDark: false,
    appBg: 'bg-pink-100',
    bgAnimClass: 'bg-anim-barbie',
    bgImage: 'https://i.postimg.cc/GH3fjn62/Barbie.jpg', 
    boardBg: 'bg-gradient-to-br from-pink-400/50 to-rose-500/50 backdrop-blur-xl',
    boardBorder: 'border-white/70',
    grooveBorder: 'border-pink-200/50',
    holeBg: 'bg-rose-900/10',
    marbleStart: '#fff0f5', // Lavender Blush
    marbleEnd: '#ec4899',   // Pink 500
    selectionRing: 'ring-fuchsia-300',
    accentColor: 'bg-pink-500 hover:bg-pink-400',
    overlayClass: 'overlay-hearts'
  },
  {
    name: 'Frozen Theme',
    isDark: true,
    appBg: 'bg-sky-950',
    bgAnimClass: 'bg-anim-ice',
    bgImage: 'https://i.postimg.cc/vcDJsdXs/Frozen.jpg', 
    boardBg: 'bg-gradient-to-br from-sky-300/30 to-blue-600/30 backdrop-blur-md',
    boardBorder: 'border-sky-200/50',
    grooveBorder: 'border-white/30',
    holeBg: 'bg-sky-950/60',
    marbleStart: '#e0f2fe', // Sky 100 (Ice)
    marbleEnd: '#0284c7',   // Sky 600 (Deep Ice)
    selectionRing: 'ring-white',
    accentColor: 'bg-sky-500 hover:bg-sky-400',
    overlayClass: 'overlay-snowflakes'
  },
  {
    name: 'Nature',
    isDark: true,
    appBg: 'bg-indigo-950', 
    bgAnimClass: 'bg-anim-nature',
    bgImage: 'https://i.postimg.cc/rzwb1LBd/Nature.jpg', 
    boardBg: 'bg-gradient-to-br from-indigo-900/50 to-blue-900/50 backdrop-blur-md',
    boardBorder: 'border-indigo-400/50',
    grooveBorder: 'border-amber-200/40', // Golden groove
    holeBg: 'bg-indigo-950/60',
    marbleStart: '#fef3c7', // Pale Gold/Yellow (Firefly light)
    marbleEnd: '#d97706',   // Deep Amber/Orange
    selectionRing: 'ring-amber-300', 
    accentColor: 'bg-amber-600 hover:bg-amber-500',
    overlayClass: 'overlay-fireflies'
  },
  {
    name: 'Under Water',
    isDark: true,
    appBg: 'bg-blue-950',
    bgAnimClass: 'bg-anim-ocean',
    bgImage: 'https://i.postimg.cc/4KG2mCvy/Under-Water.jpg', 
    boardBg: 'bg-gradient-to-br from-cyan-900/60 to-blue-900/60 backdrop-blur-xl',
    boardBorder: 'border-cyan-400/60',
    grooveBorder: 'border-cyan-300/40',
    holeBg: 'bg-blue-950/80',
    marbleStart: '#f0f9ff',
    marbleEnd: '#0099ff',
    selectionRing: 'ring-yellow-300',
    accentColor: 'bg-cyan-600 hover:bg-cyan-500',
    overlayClass: 'overlay-bubbles'
  },
  {
    name: 'Gem Stones',
    isDark: true,
    appBg: 'bg-slate-950',
    bgAnimClass: 'bg-anim-crystal',
    bgImage: 'https://i.postimg.cc/XZ6mdBb1/Gem-Stones.jpg', 
    boardBg: 'bg-gradient-to-br from-slate-900/50 to-stone-900/50 backdrop-blur-xl',
    boardBorder: 'border-white/20',
    grooveBorder: 'border-white/10',
    holeBg: 'bg-black/50',
    marbleStart: '#ffffff', 
    marbleEnd: '#0ea5e9', 
    selectionRing: 'ring-white',
    accentColor: 'bg-indigo-600 hover:bg-indigo-500',
    overlayClass: 'overlay-crystals'
  },
  {
    name: 'Disney Magic',
    isDark: true,
    appBg: 'bg-violet-950',
    bgAnimClass: 'bg-anim-disney',
    bgImage: 'https://i.postimg.cc/bZ48Mvjt/Disney.jpg', 
    boardBg: 'bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 backdrop-blur-md',
    boardBorder: 'border-yellow-200/40',
    grooveBorder: 'border-white/20',
    holeBg: 'bg-violet-950/60',
    marbleStart: '#fae8ff', // Light Purple
    marbleEnd: '#9333ea',   // Deep Purple
    selectionRing: 'ring-yellow-300',
    accentColor: 'bg-violet-600 hover:bg-violet-500',
    overlayClass: 'overlay-sparkles'
  },
  {
    name: 'Sky Kingdom',
    isDark: false,
    appBg: 'bg-sky-100',
    bgAnimClass: 'bg-anim-sky',
    bgImage: 'https://i.postimg.cc/tYLMGnYX/Sky.jpg', 
    boardBg: 'bg-gradient-to-br from-white/50 to-sky-200/50 backdrop-blur-xl',
    boardBorder: 'border-white/80',
    grooveBorder: 'border-sky-200/40',
    holeBg: 'bg-sky-900/10',
    marbleStart: '#f0f9ff', // Sky 50
    marbleEnd: '#0ea5e9',   // Sky 500
    selectionRing: 'ring-yellow-400',
    accentColor: 'bg-sky-500 hover:bg-sky-400',
    overlayClass: 'overlay-clouds'
  }
];
