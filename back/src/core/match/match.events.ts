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
    } catch (e) {
      io.to(socket.id).emit("match:nameTaken", playerName);
      logger.info("name taken");
      return;
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

  // socket.on("match:startGame", (data) => {
  //   const { room } = data;

  //   matchService.startGame(room);
  // });
  socket.on("match:startGame", (data) => {
    const { room } = data;
    logger.info(`🚀 Start game requested for room: ${room}`);

    try {
      matchService.startGame(room);
      logger.info(`✅ Successfully called matchService.startGame for room: ${room}`);
    } catch (error) {
      logger.error(`❌ Error calling matchService.startGame for room ${room}:`, error);
    }
  });

  socket.on("disconnect", (reason) => {
    const playerName = socket.data.playerName;
    const room = socket.data.currentRoom;

    logger.info(`🔌 Socket ${socket.id} disconnected: ${reason}`);

    if (playerName && room) {
      logger.info(`👋 Player ${playerName} disconnected from room ${room}`);

      try {
        // Use existing playerLeave logic
        matchService.playerLeave(playerName, room, socket);

        // Notify other players in the room
        io.to(room).emit("match:playerHasLeft", playerName);

        // Leave the socket room
        socket.leave(room);

        logger.info(`✅ Successfully cleaned up disconnected player ${playerName} from room ${room}`);
      } catch (error) {
        logger.error(`❌ Error cleaning up disconnected player ${playerName} from room ${room}:`, error);
      }
    } else {
      logger.info(`ℹ️  Disconnected socket was not in any room`);
    }
  });

  logger.info("match handler registered");
}
