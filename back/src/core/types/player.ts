export interface PlayerInputs {
  up: boolean;
  left: boolean;
  right: boolean;
  down: boolean;
  space: boolean;
  spaceHasBeenCounted: boolean;
  upHasBeenCounted: boolean;
}

export interface Player {
  name: string;
  isLeader?: boolean;
  isReady?: boolean;
}
