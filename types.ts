export enum CellState {
  INVALID = -1,
  EMPTY = 0,
  MARBLE = 1
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
  isDark: boolean;
  appBg: string;
  bgAnimClass: string;
  bgImage: string;
  boardBg: string;
  boardBorder: string;
  grooveBorder: string;
  holeBg: string;
  marbleStart: string;
  marbleEnd: string;
  selectionRing: string;
  accentColor: string;
  overlayClass: string;
}