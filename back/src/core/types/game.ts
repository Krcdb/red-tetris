export type Cell = number;

export interface Gamer {
  grid: Cell[][];
  input: GamerInputs;
  isReady: boolean;
  name: string;
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
  gamers: Gamer[];
  isRunning: boolean;
  isSolo: boolean;
  room: string;
}
