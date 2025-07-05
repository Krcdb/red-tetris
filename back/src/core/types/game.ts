// back/src/core/types/game.ts

import { Piece } from "../classes/Piece";

export type Cell = number;

export interface InputDTO {
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  up: boolean;
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

export interface TetrisPiece {
  shape: Cell[][];
  x: number;
  y: number;
  type?: string;
  color?: number;
  rotation?: number;
}

export interface Gamer {
  isReady: boolean;
  name: string;
  input: GamerInputs;
  grid: Cell[][];
  currentPiece: TetrisPiece | null;
  currentPieceIndex?: number;
  score: number;
  linesCleared: number;
  needsNextPiece: boolean;
  forcedFall?: boolean;
  nextPieces: Piece[];
}

export interface GameState {
  room: string;
  isRunning: boolean;
  isSolo: boolean;
  gamers: Gamer[];
  sharedPieces: Array<{
    type: string;
    x: number;
    y: number;
    shape: number[][];
    rotation: number;
  }>;
  currentPieceIndex: number;
}

export interface ClientGamer {
  name: string;
  grid: Cell[][];
  currentPiece: TetrisPiece | null;
  currentPieceIndex: number;
  score: number;
  linesCleared: number;
  isReady: boolean;
}

export interface ClientGameState {
  room: string;
  currentPieceIndex: number;
  nextPieces: TetrisPiece[];
  gamers: ClientGamer[];
  isRunning: boolean;
  pieceSequenceLength?: number;
}
