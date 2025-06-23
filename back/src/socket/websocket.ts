import { Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";

import { ClientToServerEvents, ServerToClientEvents } from "../types/socket-event.js";
import { registerMatchHanlder } from "./events/match.events.js";

const WEBSOCKET_CORS = {
  methods: ["GET", "POST"],
  origin: "*",
};

class MyWebSocket extends SocketIOServer<ClientToServerEvents, ServerToClientEvents> {
  private static io: MyWebSocket;

  constructor(httpServer: HTTPServer) {
    super(httpServer, {
      cors: WEBSOCKET_CORS,
    });

    this.setupListeners();
  }

  public static getInstance(httpServer?: HTTPServer): MyWebSocket {
    if (!MyWebSocket.io) {
      if (!httpServer) {
        throw new Error("No Http Server provided");
      } else {
        MyWebSocket.io = new MyWebSocket(httpServer);
      }
    }

    return MyWebSocket.io;
  }

  private setupListeners() {
    this.on("connection", (socket: Socket) => {
      console.log(`🟢 Client connected: ${socket.id}`);

      registerMatchHanlder(this, socket);

      socket.on("disconnect", () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
      });
    });
  }
}

export default MyWebSocket;
