import { Match } from "../core/types/match";
import { Player } from "../core/types/player";

export const playerOne: Player = {
  name: "Alice",
  inputs: {
    up: false,
    left: false,
    right: false,
    down: false,
    space: false,
    spaceHasBeenCounted: false,
    upHasBeenCounted:false,
  }
}

export const matchTest: Match = {
  player: [playerOne],
  roomName: "room2"
}