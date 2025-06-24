export interface GamerInputs {
  up: boolean;
  left: boolean;
  right: boolean;
  down: boolean;
  space: boolean;
  spaceHasBeenCounted: boolean;
  upHasBeenCounted: boolean;
}

export type Cell = number;

export interface Gamer {
  isReady: boolean,
  name: string,
  input: GamerInputs,
  grid: Cell[][],
}

export interface GameState {
  room: string,
  isRunning: boolean,
  isSolo: boolean,
  gamers: Gamer[],
}
