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

  console.log("🔧 SocketService: Initializing...");

  const onAnyHandler = (eventName: string, ...args: unknown[]) => {
    console.log("📡 Raw socket event received:", eventName, args);
  };

  const onGameSetup = () => {
    console.log("🔧 SocketService: Game is setup");
    store.dispatch(gameSetup());
  };

  const onGameLaunching = () => {
    console.log("🚀 SocketService: Game is launching");
    store.dispatch(gameStarted());
  };

  const onGameNewState = (gameState: ClientGameState | GameState) => {
    console.log("📤 SocketService: Received game state:", gameState);
    store.dispatch(updateGameState(gameState));
  };

  const onPlayerJoin = (match: Match) => {
    console.log("👥 SocketService: Player joined event received!");
    console.log("👥 SocketService: Match data:", match);
    console.log("👥 SocketService: Match players:", match.player);
    store.dispatch(updatePlayers(match));
  };

  const onPlayerLeft = (match: Match) => {
    console.log("👋 SocketService: Player left, updating players:", match);
    store.dispatch(updatePlayers(match));
  };

  const onNewLeader = (match: Match) => {
    console.log("👑 SocketService: New leader assigned:", match);
    store.dispatch(updatePlayers(match));
  };

  const onNameTaken = (playerName: string) => {
    console.log("❌ SocketService: Name taken:", playerName);
    store.dispatch(setLobbyError(`Name "${playerName}" is already taken!`));
  };

  const onConnect = () => {
    console.log("🔌 SocketService: Connected to server");
  };

  const onDisconnect = () => {
    console.log("🔌 SocketService: Disconnected from server");
  };

  const onConnectError = (error: Error) => {
    console.log("❌ SocketService: Connection error:", error);
    store.dispatch(setGameError("Connection error: " + error.message));
  };

  const onGameOver = (data: { playerName: string }) => {
    console.log("💀 SocketService: Game over event received", data);
    store.dispatch(gameOver());
  };

  const onMatchError = (message: string) => {
    console.error("❌ SocketService: Match error:", message);
    alert(`❌ Error: ${message}`);
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

  socket.onAny(onAnyHandler);
  cleanups.push(() => socket.offAny(onAnyHandler));

  console.log("✅ SocketService: All event listeners registered");
};

const cleanup = () => {
  console.log("🧹 SocketService: Cleaning up all listeners");

  cleanups.forEach((fn) => fn());
  cleanups.length = 0;

  isInitialized = false;

  if (socket.connected) {
    console.log("🔌 SocketService: Forcing socket disconnection");
    socket.disconnect();

    setTimeout(() => {
      socket.connect();
    }, 100);
  }

  console.log("✅ SocketService: Cleanup complete");
};

const leaveCurrentRoom = () => {
  console.log("🚪 SocketService: Leaving current room");
  socket.emit("match:leaveCurrentRoom");
};

const resetForHome = () => {
  console.log("🏠 SocketService: Resetting for home navigation");

  leaveCurrentRoom();

  cleanup();

  sessionStorage.clear();
};

const sendInput = (input: InputDTO) => {
  console.log("🎮 SocketService: Sending input:", input);
  socket.emit("game:playerInputChanges", { input });
};

const playerReady = () => {
  console.log("✅ SocketService: Sending player ready event");
  console.log("✅ SocketService: Socket connected:", socket.connected);
  console.log("✅ SocketService: Socket ID:", socket.id);

  socket.emit("game:playerReady");

  setTimeout(() => {
    console.log("⏰ SocketService: 5 seconds after playerReady, checking status...");
    const state = store.getState();
    console.log("⏰ SocketService: Current game status:", state.game.status);
  }, 5000);
};

const joinRoom = (playerName: string, room: string, gameMode?: string) => {
  const validatedGameMode = gameMode ? validateGameMode(gameMode) : "normal";
  console.log("📥 SocketService: Sending join room event:", {
    playerName,
    room,
    gameMode,
  });
  console.log("📥 SocketService: Socket connected?", socket.connected);
  socket.emit("match:playerJoin", {
    playerName,
    room,
    gameMode: validatedGameMode,
  });
  console.log("📥 SocketService: Join room event sent");
};

const leaveRoom = (playerName: string, room: string) => {
  console.log("📤 SocketService: Leaving room:", { playerName, room });
  socket.emit("match:playerLeft", { playerName, room });
};

const startGame = (room: string) => {
  console.log("🚀 SocketService: Starting game in room:", room);
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
