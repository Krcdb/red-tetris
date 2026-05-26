import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { registerGameHandler } from "../game/game.events";
import { registerMatchHanlder } from "../match/match.events";
import { matchService } from "../match/MatchService";
import { ClientToServerEvents, CustomeSocket, InterServerEvents, ServerToClientEvents, SocketData } from "../types/socket-event";
import { getLogger } from "../utils/Logger";

const logger = getLogger("WebSocket");

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
      logger.info(`Client connected: ${socket.id}`);

      registerMatchHanlder(this, socket);
      registerGameHandler(socket);

      socket.on("disconnect", () => {
        if (socket.data.currentRoom !== undefined && socket.data.playerName !== undefined) {
          matchService.playerLeave(socket.data.playerName, socket.data.currentRoom, socket);
        }
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }
}

export default MyWebSocket;
