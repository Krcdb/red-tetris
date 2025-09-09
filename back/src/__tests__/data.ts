import { Match } from "../core/types/match.js";
import { Player } from "../core/types/player.js";

export const playerOne: Player = {
  isLeader: true,
  name: "Alice",
};

export const matchTest: Match = {
  player: [playerOne],
  roomName: "room2",
  gameMode: "classic"
};

export const socketTestData = {
  playerName: "bob",
  room: "test-room",
};
