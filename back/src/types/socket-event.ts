import { Player } from "./player";

export interface ServerToClientEvents {
  'match:playerJoin': (player: Player) => void
  'match:playerLeft': (player: Player) => void
}

export interface ClientToServerEvents {
  'match:playerJoin': (data: { player: Player, room: string }) => void
  'match:playerLeft': (data: { player: Player, room: string }) => void
}
