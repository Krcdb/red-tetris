import type { Board } from "../utils/tetris";

/**
 * For each column in the board, returns the row index (0-based)
 * of the first non-zero cell. If the column is empty, returns board.length.
 */
export function calculateSpectre(board: Board): number[] {
  const height = board.length;
  const width = board[0].length;

  return Array.from({ length: width }, (_, col) => {
    for (let row = 0; row < height; row++) {
      if (board[row][col] !== 0) {
        return row;
      }
    }
    return height;
  });
}
