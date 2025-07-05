// back/src/core/types/socket-event.ts

import { Socket } from "socket.io";
import { GameState, ClientGameState, InputDTO } from "./game.js";
import { Match } from "./match.js";

export interface ClientToServerEvents {
  "game:end": (data: { room: string }) => void;
  "game:playerReady": () => void;
  "game:playerInputChanges": (data: { input: InputDTO }) => void;
  "game:pieceLanded": () => void;

  "match:playerJoin": (data: { playerName: string; room: string }) => void;
  "match:playerLeft": (data: { playerName: string; room: string }) => void;
  "match:startGame": (data: { room: string }) => void;
}

export interface ServerToClientEvents {
  "game:isLaunching": () => void;
  "game:isSetup": () => void;
  "game:newState": (gameState: GameState | ClientGameState) => void;
  "game:over": (data: { playerName: string }) => void;

  "match:nameTaken": (playerName: string) => void;
  "match:playerHasJoin": (match: Match) => void;
  "match:playerHasLeft": (match: Match) => void;
  "match:newLeader": (match: Match) => void;
  "match:roomDeleted": (data: { room: string }) => void;
  "match:error": (message: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerName?: string;
  currentRoom?: string;
}

export type CustomeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
