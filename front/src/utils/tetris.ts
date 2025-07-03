export type Cell = number;
export type Board = Cell[][];

export function initialBoard(): Board {
  return Array.from({ length: 20 }, () => Array(10).fill(0));
}

export interface Piece {
  shape: Cell[][];
  x: number;
  y: number;
  type?: string;
  color?: number;
}

export function getCellColor(cellValue: Cell): string {
  const colors = {
    0: "transparent", // Empty
    1: "#00f5ff", // I piece (cyan)
    2: "#ffff00", // O piece (yellow)
    3: "#800080", // T piece (purple)
    4: "#00ff00", // S piece (green)
    5: "#ff0000", // Z piece (red)
    6: "#0000ff", // J piece (blue)
    7: "#ffa500", // L piece (orange)
  };
  return colors[cellValue as keyof typeof colors] || "transparent";
}

export function renderBoardWithPiece(board: Board, piece: Piece | null): Board {
  if (!piece) return board;

  const rendered = board.map((row) => [...row]); // Deep copy

  piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 0) {
        const boardY = piece.y + y;
        const boardX = piece.x + x;
        if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
          rendered[boardY][boardX] = piece.color || cell;
        }
      }
    });
  });

  return rendered;
}

export function renderGhostPiece(board: Board, piece: Piece | null): Board {
  if (!piece) return board;

  let ghostY = piece.y;
  let canMove = true;

  while (canMove) {
    let collision = false;

    for (let y = 0; y < piece.shape.length && !collision; y++) {
      for (let x = 0; x < piece.shape[y].length && !collision; x++) {
        if (piece.shape[y][x] !== 0) {
          const boardY = ghostY + y + 1;
          const boardX = piece.x + x;

          if (boardY >= 20 || (boardY >= 0 && board[boardY][boardX] !== 0)) {
            collision = true;
          }
        }
      }
    }

    if (collision) {
      canMove = false;
    } else {
      ghostY++;
    }
  }

  const rendered = board.map((row) => [...row]);
  piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 0) {
        const boardY = ghostY + y;
        const boardX = piece.x + x;
        if (
          boardY >= 0 &&
          boardY < 20 &&
          boardX >= 0 &&
          boardX < 10 &&
          rendered[boardY][boardX] === 0
        ) {
          rendered[boardY][boardX] = -1;
        }
      }
    });
  });

  return rendered;
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function getLevel(linesCleared: number): number {
  return Math.floor(linesCleared / 10) + 1;
}

export function getFallSpeed(level: number): number {
  return Math.max(50, 1000 - (level - 1) * 100);
}

export function formatNextPieces(pieces: any[]): Piece[] {
  return pieces.slice(0, 5).map((p) => ({
    shape: p.shape,
    x: 0,
    y: 0,
    type: p.type,
    color: p.color,
  }));
}
