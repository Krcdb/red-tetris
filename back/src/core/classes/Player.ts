import { GamerInputs, Cell, TetrisPiece, InputDTO } from "../types/game.js";

export class Player {
  public name: string;
  public isReady: boolean;
  public input: GamerInputs;
  public grid: Cell[][];
  public currentPiece: TetrisPiece | null;
  public currentPieceIndex: number;
  public score: number;
  public linesCleared: number;
  public needsNextPiece: boolean;
  public forcedFall: boolean;
  public lockDelayCounter: number = 0;
  public isTouchingGround: boolean = false;
  public lockMoveResets: number = 0;

  constructor(name: string) {
    this.name = name;
    this.isReady = false;
    this.input = {
      up: false,
      left: false,
      right: false,
      down: false,
      space: false,
      spaceHasBeenCounted: false,
      upHasBeenCounted: false,
    };
    this.grid = this.initializeGrid();
    this.currentPiece = null;
    this.currentPieceIndex = 0;
    this.score = 0;
    this.linesCleared = 0;
    this.needsNextPiece = false;
    this.forcedFall = false;
  }

  private initializeGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let i = 0; i < 20; i++) {
      grid.push(new Array(10).fill(0));
    }
    return grid;
  }

  public setReady(): void {
    this.isReady = true;
  }

  public updateInput(newInput: InputDTO): void {
    let spaceHasBeenCounted = this.input.spaceHasBeenCounted;
    if (spaceHasBeenCounted) {
      spaceHasBeenCounted = newInput.space === this.input.space;
    }

    let upHasBeenCounted = this.input.upHasBeenCounted;
    if (upHasBeenCounted) {
      upHasBeenCounted = newInput.up === this.input.up;
    }
    this.input = { 
      ...newInput,
      spaceHasBeenCounted,
      upHasBeenCounted
    };
  }

  public setPiece(piece: TetrisPiece, index: number): void {
    this.currentPiece = { ...piece };
    this.currentPieceIndex = index;
    this.needsNextPiece = false;
  }

  public addScore(points: number): void {
    this.score += points;
  }

  public addLinesCleared(lines: number): void {
    this.linesCleared += lines;
  }

  public updateGrid(newGrid: Cell[][]): void {
    this.grid = newGrid.map((row) => [...row]);
  }

  public isGameOver(): boolean {
    for (let row = 0; row < 1; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        if (this.grid[row][col] !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  public getState() {
    return {
      name: this.name,
      isReady: this.isReady,
      grid: this.grid,
      currentPiece: this.currentPiece,
      currentPieceIndex: this.currentPieceIndex,
      score: this.score,
      linesCleared: this.linesCleared,
    };
  }
}
