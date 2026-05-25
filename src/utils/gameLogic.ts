import { BoardState, CellState, Position, GameStatus } from '../types.ts';

/**
 * Creates a BoardState (CellState[][]) from the 2D layout representation.
 */
export function createInitialBoard(layout: number[][]): BoardState {
  return layout.map(row =>
    row.map(val => {
      if (val === 0) return CellState.INVALID;
      if (val === 1) return CellState.MARBLE;
      return CellState.EMPTY;
    })
  );
}

/**
 * Counts the active marbles remaining on the board.
 */
export function countMarbles(board: BoardState): number {
  let count = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === CellState.MARBLE) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Checks if a move from "from" position to "to" position is valid on the given board.
 */
export function isMoveValid(board: BoardState, from: Position, to: Position): boolean {
  const rows = board.length;
  const cols = board[0]?.length || 0;

  // Limits check
  if (from.row < 0 || from.row >= rows || from.col < 0 || from.col >= cols) return false;
  if (to.row < 0 || to.row >= rows || to.col < 0 || to.col >= cols) return false;

  // Positions check
  if (board[from.row][from.col] !== CellState.MARBLE) return false;
  if (board[to.row][to.col] !== CellState.EMPTY) return false;

  // Must be a move of exactly distance 2 orthogonally
  const dRow = Math.abs(from.row - to.row);
  const dCol = Math.abs(from.col - to.col);

  if (!((dRow === 2 && dCol === 0) || (dRow === 0 && dCol === 2))) {
    return false;
  }

  // Find middle cell
  const midRow = (from.row + to.row) / 2;
  const midCol = (from.col + to.col) / 2;

  // Middle cell must contain a marble
  return board[midRow][midCol] === CellState.MARBLE;
}

/**
 * Evaluates whether any valid moves exist on the current board.
 */
export function hasAnyValidMoves(board: BoardState): boolean {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  
  const directions = [
    { r: -2, c: 0 },
    { r:  2, c: 0 },
    { r:  0, c: -2 },
    { r:  0, c:  2 }
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === CellState.MARBLE) {
        const fromPos = { row: r, col: c };
        for (const dir of directions) {
          const toPos = { row: r + dir.r, col: c + dir.c };
          if (isMoveValid(board, fromPos, toPos)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Determines current status of the game (WON, LOSE, or PLAYING).
 */
export function checkGameStatus(board: BoardState): GameStatus {
  const remaining = countMarbles(board);

  if (remaining === 1) {
    return GameStatus.WON;
  }

  if (!hasAnyValidMoves(board)) {
    return GameStatus.LOSE;
  }

  return GameStatus.PLAYING;
}
