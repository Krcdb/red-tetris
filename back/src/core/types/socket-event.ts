import { Socket } from "socket.io";
import { GamerInputs, GameState } from "./game";

export type CustomeSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface ClientToServerEvents {
  "match:playerJoin": (data: { playerName: string; room: string }) => void;
  "match:playerLeft": (data: { playerName: string; room: string }) => void;
  "match:startGame": (data: { room: string }) => void;

  "game:end": (data: { room: string }) => void;
  "game:playerReady": () => void;
  "game:playerInputChanges": (data: { input: GamerInputs }) => void;
}

export interface ServerToClientEvents {
  "match:playerHasJoin": (playerName: string) => void;
  "match:playerHasLeft": (playerName: string) => void;
  "match:nameTaken": (playerName: string) => void;

  "game:newState": (gameSate: GameState) => void;
  "game:isSetup": () => void;
  "game:isLaunching": () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerName?: string,
  currentRoom?: string
}
