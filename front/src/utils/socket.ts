import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/socket-events";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const socket: AppSocket = io("http://localhost:4000", {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

declare global {
  interface Window {
    socket: AppSocket;
  }
}
window.socket = socket;

socket.on("connect", () => {
  console.log("🔌 Socket connected with ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.log("❌ Socket connection error:", error);
});

export default socket;
