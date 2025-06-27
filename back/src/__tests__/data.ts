import { Match } from "../core/types/match";
import { Player } from "../core/types/player";

export const playerOne: Player = {
  name: "Alice",
  isLeader: true,
};

export const matchTest: Match = {
  player: [playerOne],
  roomName: "room2",
};

export const socketTestData = {
  playerName: "bob",
  room: "test-room",
};
