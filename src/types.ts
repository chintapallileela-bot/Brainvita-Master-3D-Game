export enum CellState {
  INVALID = 'INVALID',
  EMPTY = 'EMPTY',
  MARBLE = 'MARBLE'
}

export type BoardState = CellState[][];

export interface Position {
  row: number;
  col: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOSE = 'LOSE'
}

export interface Theme {
  id: string;
  name: string;
  boardBg: string; // Tailwind bg color class
  boardBorder: string;
  marbleBg: string; // Tailwind gradient/texture classes
  selectedMarbleBg: string;
  bgGradient: string; // main screen background gradient
  buttonColor: string;
  accentColor: string;
  textColor: string;
}

export interface GameLayout {
  id: string;
  name: string;
  description: string;
  board: number[][]; // 0=invalid, 1=marble, 2=empty
}
