import { BoardState, CellState, Position, GameStatus } from '../types';
import { BOARD_SIZE } from '../constants';

export const createInitialBoard = (layoutTemplate: number[][]): BoardState => {
  return layoutTemplate.map(row => 
    row.map(cell => cell as CellState)
  );
};

export const isValidPos = (pos: Position): boolean => {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
};

export const isMoveValid = (board: BoardState, from: Position, to: Position): boolean => {
  if (!isValidPos(from) || !isValidPos(to)) return false;
  if (board[to.row][to.col] !== CellState.EMPTY) return false;
  if (board[from.row][from.col] !== CellState.MARBLE) return false;

  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);

  if (!((rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2))) {
    return false;
  }

  const midRow = (from.row + to.row) / 2;
  const midCol = (from.col + to.col) / 2;

  if (board[midRow][midCol] !== CellState.MARBLE) return false;

  return true;
};

export const getPossibleMoves = (board: BoardState): {from: Position, to: Position}[] => {
  const moves: {from: Position, to: Position}[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === CellState.MARBLE) {
        const directions = [
          { dr: -2, dc: 0 }, { dr: 2, dc: 0 },
          { dr: 0, dc: -2 }, { dr: 0, dc: 2 }
        ];
        for (const dir of directions) {
          const to = { row: r + dir.dr, col: c + dir.dc };
          if (isMoveValid(board, { row: r, col: c }, to)) {
            moves.push({ from: { row: r, col: c }, to });
          }
        }
      }
    }
  }
  return moves;
};

export const checkGameStatus = (board: BoardState): GameStatus => {
  const moves = getPossibleMoves(board);
  if (moves.length > 0) return GameStatus.PLAYING;
  let marbleCount = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === CellState.MARBLE) marbleCount++;
    }
  }
  return marbleCount === 1 ? GameStatus.WON : GameStatus.LOST;
};

export const countMarbles = (board: BoardState): number => {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === CellState.MARBLE) count++;
    }
  }
  return count;
};