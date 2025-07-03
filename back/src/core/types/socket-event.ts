import { Socket } from "socket.io";
import { GamerInputs, ClientGameState, GameState } from "./game.js";
import { Match } from "./match.js";

export type CustomeSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface ClientToServerEvents {
  "match:playerJoin": (data: { playerName: string; room: string }) => void;
  "match:playerLeft": (data: { playerName: string; room: string }) => void;
  "match:startGame": (data: { room: string }) => void;

  "game:end": (data: { room: string }) => void;
  "game:playerReady": () => void;
  "game:playerInputChanges": (data: { input: GamerInputs }) => void;
  "game:pieceLanded": () => void;
}

export interface ServerToClientEvents {
  "match:playerHasJoin": (match: Match) => void;
  "match:playerHasLeft": (match: Match) => void;
  "match:nameTaken": (playerName: string) => void;
  "match:newLeader": (match: Match) => void;
  "match:roomDeleted": (data: { room: string }) => void;
  "match:error": (message: string) => void;

  "game:newState": (gameSate: GameState | ClientGameState) => void;
  "game:isSetup": () => void;
  "game:isLaunching": () => void;
  "game:over": (data: { playerName: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerName?: string;
  currentRoom?: string;
}
