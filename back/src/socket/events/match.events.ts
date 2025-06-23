import { Socket } from "socket.io";

import { ClientToServerEvents, ServerToClientEvents } from "../../types/socket-event.js";
import { getLogger, logger } from "../../utils/Logger.js";
import { matchService } from "../services/MatchService.js";
import MyWebSocket from "../websocket.js";

export function registerMatchHanlder(io: MyWebSocket, socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
  const context = "MatchHandler";
  const logger = getLogger(context);

  socket.on("match:playerJoin", (data) => {
    logger.info("Received data for playerJoin: " + JSON.stringify(data));
    const { player, room } = data;

    matchService.playerJoin(player, room);
    socket.join(room);
    io.to(room).emit("match:playerHasJoin", player);
  });

  socket.on("match:playerLeft", (data) => {
    const { player, room } = data;

    matchService.playerLeave(player, room);
    io.to(room).emit("match:playerHasLeft", player);
    socket.leave(room);
  });

  logger.info("match handler registered");
}
