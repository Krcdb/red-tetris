import { Socket } from "socket.io";
import { Player } from "./player";

export type CustomeSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface ClientToServerEvents {
  "match:playerJoin": (data: { playerName: string; room: string }) => void;
  "match:playerLeft": (data: { playerName: string; room: string }) => void;

  "game:start": (data: { room: string }) => void;
  "game:end": (data: { room: string }) => void;
  "game:playerInputChanges": (data: { room: string, player: Player}) => void;
}

export interface ServerToClientEvents {
  "match:playerHasJoin": (playerName: string) => void;
  "match:playerHasLeft": (playerName: string) => void;
  "match:nameTaken": (playerName: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerName?: string,
  currentRoom?: string
}
