// Duplicated from back/src/core/types/socket-event.ts (+ supporting types from
// game.ts, match.ts, player.ts). Keep in sync with the backend — both sides
// depend on these names. Only the wire-facing shapes are mirrored here; server-
// only types (e.g. node `Socket`, `InterServerEvents`, `SocketData`) are
// intentionally omitted.

export type Cell = number;

export interface Player {
  isLeader?: boolean;
  isReady?: boolean;
  name: string;
}

export interface Match {
  gameMode: string;
  player: Player[];
  roomName: string;
}

export interface TetrisPiece {
  color?: number;
  rotation?: number;
  shape: Cell[][];
  type?: string;
  x: number;
  y: number;
}

export interface ClientGamer {
  currentPiece: null | TetrisPiece;
  currentPieceIndex: number;
  grid: Cell[][];
  isReady: boolean;
  linesCleared: number;
  name: string;
  score: number;
}

export interface ClientGameState {
  currentPieceIndex: number;
  gamers: ClientGamer[];
  isRunning: boolean;
  nextPieces: TetrisPiece[];
  pieceSequenceLength?: number;
  room: string;
}

export interface GameState {
  currentPieceIndex: number;
  gamers: {
    grid: Cell[][];
    linesCleared: number;
    name: string;
    nextPieces: TetrisPiece[];
    score: number;
    spectrum: number[];
  }[];
  isRunning: boolean;
  isSolo: boolean;
  pieceSequenceLength: number;
  room: string;
}

export interface InputDTO {
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  up: boolean;
}

export interface ClientToServerEvents {
  "game:end": (data: { room: string }) => void;
  "game:pieceLanded": () => void;
  "game:playerInputChanges": (data: { input: InputDTO }) => void;
  "game:playerReady": () => void;

  "match:leaveCurrentRoom": () => void;
  "match:playerJoin": (data: { gameMode?: string; playerName: string; room: string }) => void;
  "match:playerLeft": (data: { playerName: string; room: string }) => void;
  "match:startGame": (data: { room: string }) => void;
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
