export type Cell = number;

export interface ClientGamer {
  currentPiece: null | TetrisPiece;
  currentPieceIndex: number;
  grid: Cell[][];
  isReady: boolean;
  linesCleared: number;
  name: string;
  score: number;
}

export interface ClientGameState {
  currentPieceIndex: number;
  gamers: ClientGamer[];
  isRunning: boolean;
  nextPieces: TetrisPiece[];
  pieceSequenceLength?: number;
  room: string;
}

export interface GamerInputs {
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  spaceHasBeenCounted: boolean;
  up: boolean;
  upHasBeenCounted: boolean;
}

export interface GameState {
  currentPieceIndex: number;
  gamers: {
    grid: Cell[][];
    linesCleared: number;
    name: string;
    nextPieces: TetrisPiece[];
    score: number;
    spectrum: number[];
  }[];
  isRunning: boolean;
  isSolo: boolean;
  pieceSequenceLength: number;
  room: string;
}

export interface InputDTO {
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  up: boolean;
}

export interface TetrisPiece {
  color?: number;
  rotation?: number;
  shape: Cell[][];
  type?: string;
  x: number;
  y: number;
}
