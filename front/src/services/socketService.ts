import socket from "../utils/socket";
import { store } from "../redux/store";
import {
  updateGameState,
  gameSetup,
  gameStarted,
  gameOver,
  setError as setGameError,
} from "../redux/gameSlice";
import { updatePlayers, setError as setLobbyError } from "../redux/lobbySlice";

class SocketService {
  private initialized = false;

  get socket() {
    return socket;
  }

  initialize() {
    if (this.initialized) return;
    this.initialized = true;

    console.log("🔧 SocketService: Initializing...");

    socket.onAny((eventName, ...args) => {
      console.log("📡 Raw socket event received:", eventName, args);
    });

    socket.on("game:isSetup", () => {
      console.log("🔧 SocketService: Game is setup");
      store.dispatch(gameSetup());
    });

    socket.on("game:isLaunching", () => {
      console.log("🚀 SocketService: Game is launching");
      store.dispatch(gameStarted());
    });

    socket.on("game:newState", (gameState) => {
      console.log("📤 SocketService: Received game state:", gameState);
      store.dispatch(updateGameState(gameState));
    });

    socket.on("match:playerHasJoin", (match) => {
      console.log("👥 SocketService: Player joined event received!");
      console.log("👥 SocketService: Match data:", match);
      console.log("👥 SocketService: Match players:", match?.player);
      store.dispatch(updatePlayers(match));
    });

    socket.on("match:playerHasLeft", (match) => {
      console.log("👋 SocketService: Player left, updating players:", match);
      store.dispatch(updatePlayers(match));
    });

    socket.on("match:newLeader", (match) => {
      console.log("👑 SocketService: New leader assigned:", match);
      store.dispatch(updatePlayers(match));
    });

    socket.on("match:nameTaken", (playerName) => {
      console.log("❌ SocketService: Name taken:", playerName);
      store.dispatch(setLobbyError(`Name "${playerName}" is already taken!`));
    });

    socket.on("connect", () => {
      console.log("🔌 SocketService: Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("🔌 SocketService: Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.log("❌ SocketService: Connection error:", error);
      store.dispatch(setGameError("Connection error: " + error.message));
    });

    socket.on("game:over", (data) => {
      console.log("💀 SocketService: Game over event received", data);
      store.dispatch(gameOver());
    });

    console.log("✅ SocketService: All event listeners registered");
  }

  sendInput(input: any) {
    console.log("🎮 SocketService: Sending input:", input);
    socket.emit("game:playerInputChanges", { input });
  }

  playerReady() {
    console.log("✅ SocketService: Player ready");
    socket.emit("game:playerReady");
  }

  joinRoom(playerName: string, room: string) {
    console.log("📥 SocketService: Sending join room event:", {
      playerName,
      room,
    });
    console.log("📥 SocketService: Socket connected?", socket.connected);
    socket.emit("match:playerJoin", { playerName, room });
    console.log("📥 SocketService: Join room event sent");
  }

  leaveRoom(playerName: string, room: string) {
    console.log("📤 SocketService: Leaving room:", { playerName, room });
    socket.emit("match:playerLeft", { playerName, room });
  }

  startGame(room: string) {
    console.log("🚀 SocketService: Starting game in room:", room);
    socket.emit("match:startGame", { room });
  }

  on(event: string, callback: (...args: any[]) => void) {
    socket.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    socket.off(event, callback);
  }
  disconnect() {
    socket.disconnect();
    this.initialized = false;
  }
}

export const socketService = new SocketService();
