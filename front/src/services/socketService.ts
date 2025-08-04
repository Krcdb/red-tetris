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

// State management without using 'this'
let isInitialized = false;

// Store registered event handlers for cleanup
const registeredHandlers = new Map();

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

  // Register all handlers and store them for cleanup
  const handlers = [
    { event: "game:isSetup", handler: onGameSetup },
    { event: "game:isLaunching", handler: onGameLaunching },
    { event: "game:newState", handler: onGameNewState },
    { event: "match:playerHasJoin", handler: onPlayerJoin },
    { event: "match:playerHasLeft", handler: onPlayerLeft },
    { event: "match:newLeader", handler: onNewLeader },
    { event: "match:nameTaken", handler: onNameTaken },
    { event: "connect", handler: onConnect },
    { event: "disconnect", handler: onDisconnect },
    { event: "connect_error", handler: onConnectError },
    { event: "game:over", handler: onGameOver },
  ];

  handlers.forEach(({ event, handler }) => {
    socket.on(event, handler);
    registeredHandlers.set(event, handler);
  });

  socket.onAny(onAnyHandler);
  registeredHandlers.set("onAny", onAnyHandler);

  console.log("✅ SocketService: All event listeners registered");
};

const cleanup = () => {
  console.log("🧹 SocketService: Cleaning up all listeners");

  // Remove all registered handlers
  registeredHandlers.forEach((handler, event) => {
    if (event === "onAny") {
      socket.offAny(handler);
    } else {
      socket.off(event, handler);
    }
  });

  // Clear the handlers map
  registeredHandlers.clear();

  // Reset initialization state
  isInitialized = false;
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

  // Add timeout to check if we get a response
  setTimeout(() => {
    console.log(
      "⏰ SocketService: 5 seconds after playerReady, checking status..."
    );
    const state = store.getState();
    console.log("⏰ SocketService: Current game status:", state.game.status);
  }, 5000);
};

const joinRoom = (playerName: string, room: string) => {
  console.log("📥 SocketService: Sending join room event:", {
    playerName,
    room,
  });
  console.log("📥 SocketService: Socket connected?", socket.connected);
  socket.emit("match:playerJoin", { playerName, room });
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

// Export functional interface
export const socketService = {
  initialize,
  cleanup,
  sendInput,
  playerReady,
  joinRoom,
  leaveRoom,
  startGame,
  on,
  off,
  disconnect,
  get socket() {
    return getSocket();
  },
};
