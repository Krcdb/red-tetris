export interface Player {
  isLeader?: boolean;
  isReady?: boolean;
  name: string;
}

export interface PlayerInputs {
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  spaceHasBeenCounted: boolean;
  up: boolean;
  upHasBeenCounted: boolean;
}
