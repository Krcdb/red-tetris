import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/socket-events";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

declare const process: { env: { BACKEND_URL?: string } };

// `process.env.BACKEND_URL` is substituted at build time by webpack's DefinePlugin.
// `window.__BACKEND_URL__` is an optional runtime override (set before bundle.js loads).
const runtimeBackendUrl =
  typeof window !== "undefined" && (window as unknown as { __BACKEND_URL__?: string }).__BACKEND_URL__;
const BACKEND_URL = runtimeBackendUrl || process.env.BACKEND_URL || "http://localhost:4000";

const socket: AppSocket = io(BACKEND_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

declare global {
  interface Window {
    socket: AppSocket;
  }
}
window.socket = socket;

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

export default socket;
