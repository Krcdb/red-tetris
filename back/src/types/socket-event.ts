import { Player } from "./player";

export interface ClientToServerEvents {
  "match:playerJoin": (data: { player: Player; room: string }) => void;
  "match:playerLeft": (data: { player: Player; room: string }) => void;
}

export interface ServerToClientEvents {
  "match:playerHasJoin": (player: Player) => void;
  "match:playerHasLeft": (player: Player) => void;
}
