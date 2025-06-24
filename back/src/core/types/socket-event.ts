import { Socket } from "socket.io";

export type CustomeSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface ClientToServerEvents {
  "match:playerJoin": (data: { playerName: string; room: string }) => void;
  "match:playerLeft": (data: { playerName: string; room: string }) => void;
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
