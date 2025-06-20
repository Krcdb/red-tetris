export type Cell = number; // 0 = empty; >0 = filled
export type Board = Cell[][];

export function initialBoard(): Board {
  return Array.from({ length: 20 }, () => Array(10).fill(0));
}

export interface Piece {
  shape: Cell[][];
  x: number;
  y: number;
}

export function rotate(shape: Cell[][]): Cell[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: Cell[][] = Array.from({ length: cols }, () =>
    Array(rows).fill(0)
  );
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - 1 - y] = shape[y][x];
    }
  }
  return rotated;
}

export function move(piece: Piece, dx: number, dy: number): Piece {
  return {
    shape: piece.shape,
    x: piece.x + dx,
    y: piece.y + dy,
  };
}

export function isValidPosition(board: Board, piece: Piece): boolean {
  const { shape, x: px, y: py } = piece;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] === 0) continue;
      const by = py + y;
      const bx = px + x;
      // out of bounds
      if (by < 0 || by >= board.length || bx < 0 || bx >= board[0].length) {
        return false;
      }
      // collision
      if (board[by][bx] !== 0) {
        return false;
      }
    }
  }
  return true;
}

export function tryRotate(board: Board, piece: Piece): Piece {
  const rotatedShape = rotate(piece.shape);
  const rotatedPiece = { ...piece, shape: rotatedShape };
  return isValidPosition(board, rotatedPiece) ? rotatedPiece : piece;
}

export function softDrop(board: Board, piece: Piece): Piece {
  const candidate = move(piece, 0, 1);
  return isValidPosition(board, candidate) ? candidate : piece;
}

export function hardDrop(board: Board, piece: Piece): Piece {
  let dropPiece = piece;
  while (true) {
    const next = move(dropPiece, 0, 1);
    if (!isValidPosition(board, next)) break;
    dropPiece = next;
  }
  return dropPiece;
}

export function mergePiece(board: Board, piece: Piece): Board {
  const newBoard = board.map((row) => [...row]);
  piece.shape.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell !== 0) newBoard[piece.y + y][piece.x + x] = cell;
    })
  );
  return newBoard;
}

export function clearLines(board: Board): [Board, number] {
  const newRows = board.filter((row) => row.some((cell) => cell === 0));
  const linesCleared = board.length - newRows.length;
  const emptyRows = Array.from({ length: linesCleared }, () =>
    Array(board[0].length).fill(0)
  );

  const newBoard = emptyRows.concat(newRows);

  return [newBoard, linesCleared];
}
