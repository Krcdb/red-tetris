import { Player } from "./player";

export interface ClientToServerEvents {
  "match:playerJoin": (data: { playerName: string; room: string }) => void;
  "match:playerLeft": (data: { playerName: string; room: string }) => void;
}

export interface ServerToClientEvents {
  "match:playerHasJoin": (player: Player) => void;
  "match:playerHasLeft": (player: Player) => void;
}
