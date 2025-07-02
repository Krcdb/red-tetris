// import { io } from "socket.io-client";

// const socket = io("http://localhost:4000", {
//   path: "/socket.io",
//   autoConnect: false,
// });

// export default socket;

import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

// Add global socket for debugging
(window as any).socket = socket;

// Add connection event listeners for debugging
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
