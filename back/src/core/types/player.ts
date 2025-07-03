// back/src/core/types/player.ts

export interface Player {
  name: string;
  isLeader?: boolean;
  isReady?: boolean;
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
