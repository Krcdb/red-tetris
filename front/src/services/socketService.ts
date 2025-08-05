import socket from "../utils/socket";
import { store } from "../redux/store";
import {
  updateGameState,
  gameSetup,
  gameStarted,
  gameOver,
  setError as setGameError,
  gameOverWithNavigation,
} from "../redux/gameSlice";
import { updatePlayers, setError as setLobbyError } from "../redux/lobbySlice";
import { validateGameMode } from "../utils/gameMode";

let isInitialized = false;

const registeredHandlers = new Map();

const registerHandler = (event: string, handler: (...args: any[]) => void) => {
  socket.on(event, handler);
  registeredHandlers.set(event, handler);
};

const onMatchError = (message: string) => {
  console.error("❌ SocketService: Match error:", message);

  if (message.includes("game mode") || message.includes("mode")) {
    alert(
      "⚠️ This room requires a different game mode. Please go back and select the correct mode, or choose a different room name."
    );
  } else if (message.includes("Name already taken")) {
    alert(
      "⚠️ That player name is already taken in this room. Please choose a different name."
    );
  } else {
    alert(`⚠️ ${message}`);
  }
  setTimeout(() => {
    window.location.href = "/";
  }, 100);
};

const initialize = () => {
  if (isInitialized) return;
  isInitialized = true;

  console.log("🔧 SocketService: Initializing...");

  const onAnyHandler = (eventName: string, ...args: any[]) => {
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

  const onGameNewState = (gameState: any) => {
    console.log("📤 SocketService: Received game state:", gameState);
    store.dispatch(updateGameState(gameState));
  };

  const onPlayerJoin = (match: any) => {
    console.log("👥 SocketService: Player joined event received!");
    console.log("👥 SocketService: Match data:", match);
    console.log("👥 SocketService: Match players:", match?.player);
    store.dispatch(updatePlayers(match));
  };

  const onPlayerLeft = (match: any) => {
    console.log("👋 SocketService: Player left, updating players:", match);
    store.dispatch(updatePlayers(match));
  };

  const onNewLeader = (match: any) => {
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

  const onConnectError = (error: any) => {
    console.log("❌ SocketService: Connection error:", error);
    store.dispatch(setGameError("Connection error: " + error.message));
  };

  const onGameOver = (data: any) => {
    console.log("💀 SocketService: Game over event received", data);
    store.dispatch(gameOver());
  };

  const onMatchError = (message: string) => {
    console.error("❌ SocketService: Match error:", message);
    alert(`❌ Error: ${message}`);
  };

  // ✅ Register all handlers in one place
  const handlers = [
    { event: "game:isSetup", handler: onGameSetup },
    { event: "game:isLaunching", handler: onGameLaunching },
    { event: "game:newState", handler: onGameNewState },
    { event: "match:playerHasJoin", handler: onPlayerJoin },
    { event: "match:playerHasLeft", handler: onPlayerLeft },
    { event: "match:newLeader", handler: onNewLeader },
    { event: "match:nameTaken", handler: onNameTaken },
    { event: "match:error", handler: onMatchError }, // ✅ Only here
    { event: "connect", handler: onConnect },
    { event: "disconnect", handler: onDisconnect },
    { event: "connect_error", handler: onConnectError },
    { event: "game:over", handler: onGameOver },
  ];

  handlers.forEach(({ event, handler }) => {
    registerHandler(event, handler);
  });

  socket.onAny(onAnyHandler);
  registeredHandlers.set("onAny", onAnyHandler);

  console.log("✅ SocketService: All event listeners registered");
};

const cleanup = () => {
  console.log("🧹 SocketService: Cleaning up all listeners");

  registeredHandlers.forEach((handler, event) => {
    if (event === "onAny") {
      socket.offAny(handler);
    } else {
      socket.off(event, handler);
    }
  });

  registeredHandlers.clear();

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

const sendInput = (input: any) => {
  console.log("🎮 SocketService: Sending input:", input);
  socket.emit("game:playerInputChanges", { input });
};

const playerReady = () => {
  console.log("✅ SocketService: Sending player ready event");
  console.log("✅ SocketService: Socket connected:", socket.connected);
  console.log("✅ SocketService: Socket ID:", socket.id);

  socket.emit("game:playerReady");

  setTimeout(() => {
    console.log(
      "⏰ SocketService: 5 seconds after playerReady, checking status..."
    );
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

const on = (event: string, callback: (...args: any[]) => void) => {
  socket.on(event, callback);
};

const off = (event: string, callback?: (...args: any[]) => void) => {
  socket.off(event, callback);
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
