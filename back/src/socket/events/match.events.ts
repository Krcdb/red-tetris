import { Socket } from "socket.io";

import { getLogger, logger } from "../../utils/Logger.js";
import { matchService } from "../services/MatchService.js";
import MyWebSocket from "../websocket.js";
import { ClientToServerEvents, ServerToClientEvents } from "../../types/socket-event.js";

export function registerMatchHanlder(io: MyWebSocket, socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
  const context = "MatchHandler";
  const logger = getLogger(context);

  socket.on("match:playerJoin", (data) => {
    const { player, room } = data;

    matchService.playerJoin(player, room);
    socket.join(room);
    io.to(room).emit("match:playerJoin", player);
  });

  socket.on("match:playerLeft", (data) => {
    const { player, room } = data;

    matchService.playerLeave(player, room);
    socket.leave(room);
    io.to(room).emit("match:playerLeft", player);
  });

  logger.info("match handler registered");
}
