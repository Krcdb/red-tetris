import { Player } from "./player.js";

export interface Match {
  gameMode: string;
  player: Player[];
  roomName: string;
}
