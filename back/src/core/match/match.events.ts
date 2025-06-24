import { Socket } from "socket.io";

import { ClientToServerEvents, ServerToClientEvents } from "../types/socket-event.js";
import { getLogger, logger } from "../utils/Logger.js";
import { matchService } from "./MatchService.js";
import MyWebSocket from "../socket/websocket.js";

export function registerMatchHanlder(io: MyWebSocket, socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
  const context = "MatchHandler";
  const logger = getLogger(context);

  socket.on("match:playerJoin", (data) => {
    const { playerName, room } = data;

    const player = {id: socket.id, name: playerName}

    matchService.playerJoin(player, room);
    socket.join(room);
    io.to(room).emit("match:playerHasJoin", player);
  });

  socket.on("match:playerLeft", (data) => {
    const { playerName, room } = data;
    const player = {id: socket.id, name: playerName}

    matchService.playerLeave(player, room);
    io.to(room).emit("match:playerHasLeft", player);
    socket.leave(room);
  });

  logger.info("match handler registered");
}
