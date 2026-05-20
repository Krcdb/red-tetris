import { Piece } from "../classes/Piece";

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

export interface Gamer {
  currentPiece: null | TetrisPiece;
  currentPieceIndex?: number;
  forcedFall?: boolean;
  grid: Cell[][];
  input: GamerInputs;
  isReady: boolean;
  linesCleared: number;
  name: string;
  needsNextPiece: boolean;
  nextPieces: Piece[];
  score: number;
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
