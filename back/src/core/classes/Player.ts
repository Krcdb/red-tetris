import { Cell, GamerInputs, InputDTO, TetrisPiece } from "../types/game.js";

export class Player {
  public currentPiece: null | TetrisPiece;
  public currentPieceIndex: number;
  public forcedFall: boolean;
  public grid: Cell[][];
  public input: GamerInputs;
  public isReady: boolean;
  public isTouchingGround = false;
  public linesCleared: number;
  public lockDelayCounter = 0;
  public lockMoveResets = 0;
  public name: string;
  public needsNextPiece: boolean;
  public score: number;
  public hasLost: boolean = false;

  constructor(name: string) {
    this.name = name;
    this.isReady = false;
    this.input = {
      down: false,
      left: false,
      right: false,
      space: false,
      spaceHasBeenCounted: false,
      up: false,
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

  public addLinesCleared(lines: number): void {
    this.linesCleared += lines;
  }

  public addScore(points: number): void {
    this.score += points;
  }

  public getState() {
    return {
      currentPiece: this.currentPiece,
      currentPieceIndex: this.currentPieceIndex,
      grid: this.grid,
      isReady: this.isReady,
      linesCleared: this.linesCleared,
      name: this.name,
      score: this.score,
      hasLost: this.hasLost,
    };
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

  public setPiece(piece: TetrisPiece, index: number): void {
    this.currentPiece = { ...piece };
    this.currentPieceIndex = index;
    this.needsNextPiece = false;
  }

  public setHasLost(): void {
    this.hasLost = true;
  }

  public setReady(): void {
    this.isReady = true;
  }

  public updateGrid(newGrid: Cell[][]): void {
    this.grid = newGrid.map((row) => [...row]);
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
      upHasBeenCounted,
    };
  }

  private initializeGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let i = 0; i < 20; i++) {
      grid.push(new Array(10).fill(0));
    }
    return grid;
  }
}
