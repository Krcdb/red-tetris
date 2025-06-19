import { Socket } from "socket.io";
import MyWebSocket from "../websocket";
import { getLogger, logger } from "../../utils/Logger";
import { matchService } from "../services/MatchService";

export function registerMatchHanlder(io: MyWebSocket, socket: Socket) {
  const context = "MatchHandler";
  const logger = getLogger(context);

  socket.on('match:playerJoin', (data) => {
    const { player, room } = data

    matchService.playerJoin(data.player, data.room);
    socket.join(data.room);
    io.to(data.room).emit('match:playerJoin', data.player);
  })

  socket.on('match:playerLeft', (data) => {
    matchService.playerLeave(data.player, data.room);
    socket.leave(data.room);
    io.to(data.room).emit('match:playerLeft', data.player);
  })

  logger.info('match handler registered');
}