import { Theme, GameLayout } from './types.ts';

export const THEMES: Theme[] = [
  {
    id: 'cosmic',
    name: 'Cosmic Nebula',
    boardBg: 'bg-slate-900/90 backdrop-blur-xl',
    boardBorder: 'border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.35)]',
    marbleBg: 'bg-gradient-to-br from-indigo-300 via-indigo-500 to-indigo-950',
    selectedMarbleBg: 'bg-gradient-to-br from-cyan-300 via-cyan-500 to-cyan-800 shadow-[0_0_25px_rgba(6,182,212,0.85)]',
    bgGradient: 'from-slate-950 via-indigo-950 to-slate-950',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20',
    accentColor: 'text-indigo-400',
    textColor: 'text-slate-200'
  },
  {
    id: 'gold-forest',
    name: 'Royal Forest',
    boardBg: 'bg-emerald-950/90 backdrop-blur-xl',
    boardBorder: 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.25)]',
    marbleBg: 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-900',
    selectedMarbleBg: 'bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-800 shadow-[0_0_25px_rgba(52,211,153,0.85)]',
    bgGradient: 'from-slate-950 via-emerald-950/80 to-slate-950',
    buttonColor: 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-amber-500/20 font-bold',
    accentColor: 'text-amber-400',
    textColor: 'text-emerald-100'
  },
  {
    id: 'royal-velvet',
    name: 'Royal Velvet',
    boardBg: 'bg-rose-950/95 backdrop-blur-xl',
    boardBorder: 'border-pink-500/40 shadow-[0_0_40px_rgba(244,63,94,0.25)]',
    marbleBg: 'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-700',
    selectedMarbleBg: 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-900 shadow-[0_0_25px_rgba(244,63,94,0.85)]',
    bgGradient: 'from-slate-950 via-rose-950/70 to-slate-950',
    buttonColor: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20',
    accentColor: 'text-rose-400',
    textColor: 'text-rose-100'
  },
  {
    id: 'amber-wood',
    name: 'Classic Amber',
    boardBg: 'bg-gradient-to-b from-[#4a2e12] to-[#2b1803]',
    boardBorder: 'border-[#8c5a2c] shadow-[0_20px_50px_rgba(0,0,0,0.8)]',
    marbleBg: 'bg-gradient-to-br from-[#ebe6d8] via-[#cfc2a9] to-[#807255]',
    selectedMarbleBg: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-850 shadow-[0_0_25px_rgba(249,115,22,0.85)]',
    bgGradient: 'from-[#1a1006] via-[#2d1b0a] to-[#120a03]',
    buttonColor: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20',
    accentColor: 'text-orange-400',
    textColor: 'text-orange-100'
  }
];

export const LAYOUTS: GameLayout[] = [
  {
    id: 'english',
    name: 'English (Classic 33)',
    description: 'The standard English Brainvita cross-shaped board. A perfect challenge.',
    board: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 2, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0]
    ]
  },
  {
    id: 'french',
    name: 'French (37 Holes)',
    description: 'European variation adding corner cells for complex diagonal jumps.',
    board: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 2, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0]
    ]
  },
  {
    id: 'mini',
    name: 'Mini Cross (9 Holes)',
    description: 'An easier 9-peg layout starting with only a few marbles. Great for learning!',
    board: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 1, 1, 2, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ]
  }
];
