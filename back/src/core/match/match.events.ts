import MyWebSocket from "../socket/websocket.js";
import { Match } from "../types/match.js";
import { CustomeSocket } from "../types/socket-event.js";
import { getLogger } from "../utils/Logger.js";
import { matchService } from "./MatchService.js";

export function registerMatchHanlder(io: MyWebSocket, socket: CustomeSocket) {
  const context = "MatchHandler";
  const logger = getLogger(context);

  socket.on("match:playerJoin", (data) => {
    const { playerName, room } = data;
    let match: Match;
  
    try {
      match = matchService.playerJoin(playerName, room, socket);
    } catch (e) {
      io.to(socket.id).emit("match:nameTaken", playerName);
      logger.info("name taken");
      return;
    }
    socket.join(room);
    io.to(room).emit("match:playerHasJoin", match);
  });

  socket.on("match:playerLeft", (data) => {
    const { playerName, room } = data;

    const match = matchService.playerLeave(playerName, room, socket);
    if (match) {
      io.to(room).emit("match:playerHasLeft", match);
    }
    socket.leave(room);
  });

  socket.on("match:startGame", (data) => {
    const { room } = data;

    matchService.startGame(room, socket);
  });

  logger.info("match handler registered");
}
