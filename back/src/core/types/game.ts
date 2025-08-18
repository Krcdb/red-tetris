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
  gamers: Gamer[];
  isRunning: boolean;
  isSolo: boolean;
  room: string;
  sharedPieces: {
    rotation: number;
    shape: number[][];
    type: string;
    x: number;
    y: number;
  }[];
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
