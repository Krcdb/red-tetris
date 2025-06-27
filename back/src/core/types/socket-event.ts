import { Socket } from "socket.io";

import { GamerInputs, GameState } from "./game";

export interface ClientToServerEvents {
  "game:end": (data: { room: string }) => void;
  "game:playerInputChanges": (data: { input: GamerInputs }) => void;
  "game:playerReady": () => void;

  "match:playerJoin": (data: { playerName: string; room: string }) => void;
  "match:playerLeft": (data: { playerName: string; room: string }) => void;
  "match:startGame": (data: { room: string }) => void;
}

export type CustomeSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface InterServerEvents {
  ping: () => void;
}

export interface ServerToClientEvents {
  "game:isLaunching": () => void;
  "game:isSetup": () => void;
  "game:newState": (gameSate: GameState) => void;

  "match:nameTaken": (playerName: string) => void;
  "match:playerHasJoin": (playerName: string) => void;
  "match:playerHasLeft": (playerName: string) => void;
}

export interface SocketData {
  currentRoom?: string;
  playerName?: string;
}
