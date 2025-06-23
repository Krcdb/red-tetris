import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  path: "/socket.io",
  autoConnect: false,
});

export default socket;
