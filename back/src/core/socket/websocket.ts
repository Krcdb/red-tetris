import { Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";

import { registerGameHandler } from "../game/game.events.js";
import { registerMatchHanlder } from "../match/match.events.js";
import { matchService } from "../match/MatchService.js";
import { ClientToServerEvents, CustomeSocket, InterServerEvents, ServerToClientEvents, SocketData } from "../types/socket-event.js";

const WEBSOCKET_CORS = {
  methods: ["GET", "POST"],
  origin: "*",
};

class MyWebSocket extends SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
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
    this.on("connection", (socket: CustomeSocket) => {
      console.log(`🟢 Client connected: ${socket.id}`);

      registerMatchHanlder(this, socket);
      registerGameHandler(socket);

      socket.on("disconnect", () => {
        if (socket.data.currentRoom !== undefined && socket.data.playerName !== undefined) {
          matchService.playerLeave(socket.data.playerName, socket.data.currentRoom, socket);
        }
        console.log(`🔴 Client disconnected: ${socket.id}`);
      });
    });
  }
}

export default MyWebSocket;
