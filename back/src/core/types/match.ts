import { Player } from "./player.js";

export interface Match {
  player: Player[];
  roomName: string;
  gameMode: string;
}
