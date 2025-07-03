import { Cell } from "../types/game.js";

export class Piece {
  public shape: Cell[][];
  public x: number;
  public y: number;
  public type: string;
  public color: number;
  public rotation: number;

  constructor(type: string, x: number = 4, y: number = 0) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.shape = this.getShapeForType(type);
    this.color = this.getColorForType(type);
  }

  private getShapeForType(type: string): Cell[][] {
    const shapes: { [key: string]: Cell[][] } = {
      I: [[1, 1, 1, 1]],
      O: [
        [1, 1],
        [1, 1],
      ],
      T: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      J: [
        [1, 0, 0],
        [1, 1, 1],
      ],
      L: [
        [0, 0, 1],
        [1, 1, 1],
      ],
    };
    return shapes[type] || shapes["T"];
  }

  private getColorForType(type: string): number {
    const colors: { [key: string]: number } = {
      I: 1,
      O: 2,
      T: 3,
      S: 4,
      Z: 5,
      J: 6,
      L: 7,
    };
    return colors[type] || 1;
  }

  public rotate(): Piece {
    const rows = this.shape.length;
    const cols = this.shape[0].length;
    const rotatedShape: Cell[][] = [];

    for (let i = 0; i < cols; i++) {
      rotatedShape[i] = [];
      for (let j = 0; j < rows; j++) {
        rotatedShape[i][j] = this.shape[rows - 1 - j][i];
      }
    }

    const rotatedPiece = new Piece(this.type, this.x, this.y);
    rotatedPiece.shape = rotatedShape;
    rotatedPiece.rotation = (this.rotation + 1) % 4;
    rotatedPiece.color = this.color;

    return rotatedPiece;
  }

  public move(dx: number, dy: number): Piece {
    const movedPiece = new Piece(this.type, this.x + dx, this.y + dy);
    movedPiece.shape = this.shape.map((row) => [...row]);
    movedPiece.rotation = this.rotation;
    movedPiece.color = this.color;

    return movedPiece;
  }

  public clone(): Piece {
    const clonedPiece = new Piece(this.type, this.x, this.y);
    clonedPiece.shape = this.shape.map((row) => [...row]);
    clonedPiece.rotation = this.rotation;
    clonedPiece.color = this.color;

    return clonedPiece;
  }

  public isValidPosition(board: Cell[][]): boolean {
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col] !== 0) {
          const boardY = this.y + row;
          const boardX = this.x + col;

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

  public canMoveDown(board: Cell[][]): boolean {
    const testPiece = this.move(0, 1);
    return testPiece.isValidPosition(board);
  }

  public hardDrop(board: Cell[][]): Piece {
    let dropPiece = this.clone();
    while (dropPiece.canMoveDown(board)) {
      dropPiece = dropPiece.move(0, 1);
    }
    return dropPiece;
  }

  public mergeIntoBoard(board: Cell[][]): Cell[][] {
    const newBoard = board.map((row) => [...row]);

    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col] !== 0) {
          const boardY = this.y + row;
          const boardX = this.x + col;

          if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
            newBoard[boardY][boardX] = this.color;
          }
        }
      }
    }

    return newBoard;
  }

  public static generateRandomPiece(x: number = 4, y: number = 0): Piece {
    const pieceTypes = ["I", "O", "T", "S", "Z", "J", "L"];
    const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    return new Piece(randomType, x, y);
  }

  public static generatePieceSequence(count: number): Piece[] {
    const pieces: Piece[] = [];
    for (let i = 0; i < count; i++) {
      pieces.push(Piece.generateRandomPiece());
    }
    return pieces;
  }
}
