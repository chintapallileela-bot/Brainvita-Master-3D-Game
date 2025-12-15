export enum CellState {
  INVALID = -1, // No hole exists here (corners)
  EMPTY = 0,    // Hole exists but is empty
  MARBLE = 1    // Hole exists and has a marble
}

export interface Position {
  row: number;
  col: number;
}

export type BoardState = CellState[][];

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST'
}

export interface GameLayout {
  name: string;
  description: string;
  board: number[][];
}

export interface Theme {
  name: string;
  isDark: boolean;      // Triggers light/dark text mode
  appBg: string;        // Fallback Tailwind class
  bgAnimClass: string;  // CSS class for the specific animated background (fallback/base)
  bgImage: string;      // URL for the animated background image (GIF)
  boardBg: string;      // CSS class for board gradient
  boardBorder: string;  // CSS class for board border color
  grooveBorder: string; // CSS class for the inner groove line
  holeBg: string;       // CSS class for the hole background
  marbleStart: string;  // Hex color for marble gradient start
  marbleEnd: string;    // Hex color for marble gradient end
  selectionRing: string; // CSS class for selection ring color
  accentColor: string;  // CSS class for primary buttons/highlights
  overlayClass: string; // CSS class for the particle/overlay effects
}