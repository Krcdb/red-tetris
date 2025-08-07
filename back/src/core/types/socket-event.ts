import { Socket } from "socket.io";

import { ClientGameState, GameState, InputDTO } from "./game.js";
import { Match } from "./match.js";

export interface ClientToServerEvents {
  "game:end": (data: { room: string }) => void;
  "game:pieceLanded": () => void;
  "game:playerInputChanges": (data: { input: InputDTO }) => void;
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
  "game:newState": (gameState: ClientGameState | GameState) => void;
  "game:over": (data: { playerName: string }) => void;

  "match:error": (message: string) => void;
  "match:nameTaken": (playerName: string) => void;
  "match:newLeader": (match: Match) => void;
  "match:playerHasJoin": (match: Match) => void;
  "match:playerHasLeft": (match: Match) => void;
  "match:roomDeleted": (data: { room: string }) => void;
}

export interface SocketData {
  currentRoom?: string;
  playerName?: string;
}
