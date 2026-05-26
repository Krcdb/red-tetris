import { Player } from "./player";

export interface Match {
  gameMode: string;
  player: Player[];
  roomName: string;
}
