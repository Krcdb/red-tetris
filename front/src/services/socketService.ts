import socket from "../utils/socket";
import { store } from "../redux/store";
import { updateGameState, gameSetup, gameStarted, gameOver, setError as setGameError } from "../redux/gameSlice";
import { updatePlayers, setError as setLobbyError } from "../redux/lobbySlice";
import { validateGameMode } from "../utils/gameMode";
import type { Socket } from "socket.io-client";
import type {
  ClientGameState,
  GameState,
  InputDTO,
  Match,
} from "../types/socket-events";

let isInitialized = false;

const cleanups: Array<() => void> = [];

const initialize = () => {
  if (isInitialized) return;
  isInitialized = true;

  const onGameSetup = () => {
    store.dispatch(gameSetup());
  };

  const onGameLaunching = () => {
    store.dispatch(gameStarted());
  };

  const onGameNewState = (gameState: ClientGameState | GameState) => {
    store.dispatch(updateGameState(gameState));
  };

  const onPlayerJoin = (match: Match) => {
    store.dispatch(updatePlayers(match));
  };

  const onPlayerLeft = (match: Match) => {
    store.dispatch(updatePlayers(match));
  };

  const onNewLeader = (match: Match) => {
    store.dispatch(updatePlayers(match));
  };

  const onNameTaken = (playerName: string) => {
    store.dispatch(setLobbyError(`Name "${playerName}" is already taken!`));
  };

  const onConnect = () => {};

  const onDisconnect = () => {};

  const onConnectError = (error: Error) => {
    console.error("SocketService: Connection error:", error);
    store.dispatch(setGameError("Connection error: " + error.message));
  };

  const onGameOver = (_data: { playerName: string }) => {
    store.dispatch(gameOver());
  };

  const onMatchError = (message: string) => {
    console.error("SocketService: Match error:", message);
    store.dispatch(setLobbyError(message));
  };

  socket.on("game:isSetup", onGameSetup);
  cleanups.push(() => socket.off("game:isSetup", onGameSetup));

  socket.on("game:isLaunching", onGameLaunching);
  cleanups.push(() => socket.off("game:isLaunching", onGameLaunching));

  socket.on("game:newState", onGameNewState);
  cleanups.push(() => socket.off("game:newState", onGameNewState));

  socket.on("match:playerHasJoin", onPlayerJoin);
  cleanups.push(() => socket.off("match:playerHasJoin", onPlayerJoin));

  socket.on("match:playerHasLeft", onPlayerLeft);
  cleanups.push(() => socket.off("match:playerHasLeft", onPlayerLeft));

  socket.on("match:newLeader", onNewLeader);
  cleanups.push(() => socket.off("match:newLeader", onNewLeader));

  socket.on("match:nameTaken", onNameTaken);
  cleanups.push(() => socket.off("match:nameTaken", onNameTaken));

  socket.on("match:error", onMatchError);
  cleanups.push(() => socket.off("match:error", onMatchError));

  socket.on("connect", onConnect);
  cleanups.push(() => socket.off("connect", onConnect));

  socket.on("disconnect", onDisconnect);
  cleanups.push(() => socket.off("disconnect", onDisconnect));

  socket.on("connect_error", onConnectError);
  cleanups.push(() => socket.off("connect_error", onConnectError));

  socket.on("game:over", onGameOver);
  cleanups.push(() => socket.off("game:over", onGameOver));
};

const cleanup = () => {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;

  isInitialized = false;

  if (socket.connected) {
    socket.disconnect();

    setTimeout(() => {
      socket.connect();
    }, 100);
  }
};

const leaveCurrentRoom = () => {
  socket.emit("match:leaveCurrentRoom");
};

const resetForHome = () => {
  leaveCurrentRoom();

  cleanup();

  sessionStorage.clear();
};

const sendInput = (input: InputDTO) => {
  socket.emit("game:playerInputChanges", { input });
};

const playerReady = () => {
  socket.emit("game:playerReady");
};

const joinRoom = (playerName: string, room: string, gameMode?: string) => {
  const validatedGameMode = gameMode ? validateGameMode(gameMode) : "normal";
  socket.emit("match:playerJoin", {
    playerName,
    room,
    gameMode: validatedGameMode,
  });
};

const leaveRoom = (playerName: string, room: string) => {
  socket.emit("match:playerLeft", { playerName, room });
};

const startGame = (room: string) => {
  socket.emit("match:startGame", { room });
};

// Escape hatch for ad-hoc listeners (currently only used by tests). Cast
// through `Socket` (untyped events map) so arbitrary string event names work.
const untyped = socket as unknown as Socket;

const on = (event: string, callback: (...args: unknown[]) => void) => {
  untyped.on(event, callback);
};

const off = (event: string, callback?: (...args: unknown[]) => void) => {
  untyped.off(event, callback);
};

const disconnect = () => {
  cleanup();
  socket.disconnect();
};

const getSocket = () => socket;

export const socketService = {
  initialize,
  cleanup,
  resetForHome,
  sendInput,
  playerReady,
  joinRoom,
  leaveRoom,
  leaveCurrentRoom,
  startGame,
  on,
  off,
  disconnect,
  get socket() {
    return getSocket();
  },
};
