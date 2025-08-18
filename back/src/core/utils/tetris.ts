import { Cell, TetrisPiece } from "../types/game";

export function canMoveDown(board: Cell[][], piece: TetrisPiece): boolean {
  const testPiece = { ...piece, y: piece.y + 1 };
  return isValidPosition(board, testPiece);
}

export function clearLines(board: Cell[][]): { linesCleared: number; newBoard: Cell[][]; } {
  const newBoard: Cell[][] = [];
  let linesCleared = 0;

  for (const row of board) {
    const isFullLine = row.every((cell) => cell !== 0);

    if (!isFullLine) {
      newBoard.push([...row]);
    } else {
      linesCleared++;
    }
  }

  while (newBoard.length < 20) {
    newBoard.unshift(new Array<number>(10).fill(0));
  }

  return { linesCleared, newBoard };
}

export function isValidPosition(board: Cell[][], piece: TetrisPiece): boolean {
  const { shape, x, y } = piece;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] !== 0) {
        const boardY = y + row;
        const boardX = x + col;

        if (boardX < 0 || boardX >= 10 || boardY < 0 || boardY >= 20) {
          return false;
        }

        if (board[boardY][boardX] !== 0) {
          return false;
        }
      }
    }
  }

  return true;
}

export function mergePiece(board: Cell[][], piece: TetrisPiece): Cell[][] {
  const newBoard = board.map((row) => [...row]); // Deep copy
  const { shape, x, y } = piece;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] !== 0) {
        const boardY = y + row;
        const boardX = x + col;

        if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
          newBoard[boardY][boardX] = piece.color ?? shape[row][col];
        }
      }
    }
  }

  return newBoard;
}

export function rotatePiece(piece: TetrisPiece): TetrisPiece {
  const { shape } = piece;
  const rows = shape.length;
  const cols = shape[0].length;

  const rotatedShape: number[][] = [];
  for (let i = 0; i < cols; i++) {
    rotatedShape[i] = [];
    for (let j = 0; j < rows; j++) {
      rotatedShape[i][j] = shape[rows - 1 - j][i];
    }
  }

  return {
    ...piece,
    shape: rotatedShape,
  };
}
