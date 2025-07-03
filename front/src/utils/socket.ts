import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

(window as any).socket = socket;

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
