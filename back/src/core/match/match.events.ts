
import { CustomeSocket } from "../types/socket-event.js";
import { getLogger } from "../utils/Logger.js";
import { matchService } from "./MatchService.js";
import MyWebSocket from "../socket/websocket.js";

export function registerMatchHanlder(io: MyWebSocket, socket: CustomeSocket) {
  const context = "MatchHandler";
  const logger = getLogger(context);

  socket.on("match:playerJoin", (data) => {
    const { playerName, room } = data;
    
    try {
      matchService.playerJoin(playerName, room, socket);
      logger.info("ok");
      
    } catch (e) {
      io.to(socket.id).emit("match:nameTaken", playerName);
      logger.info("name taken");
      return ;
    }
    socket.join(room);
    io.to(room).emit("match:playerHasJoin", playerName);
  });

  socket.on("match:playerLeft", (data) => {
    const { playerName, room } = data;

    matchService.playerLeave(playerName, room, socket);
    io.to(room).emit("match:playerHasLeft", playerName);
    socket.leave(room);
  });

  logger.info("match handler registered");
}
