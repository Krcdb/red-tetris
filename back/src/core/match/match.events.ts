import { CustomeSocket } from "../types/socket-event.js";
import { getLogger } from "../utils/Logger.js";
import { matchService } from "./MatchService.js";
import MyWebSocket from "../socket/websocket.js";
import { gameService } from "../game/GameService.js";

export function registerMatchHanlder(io: MyWebSocket, socket: CustomeSocket) {
  const context = "MatchHandler";
  const logger = getLogger(context);

  socket.on("match:playerJoin", (data) => {
    const { playerName, room } = data;

    try {
      const match = matchService.playerJoin(playerName, room, socket);
      socket.join(room);

      // Use the new getMatch method
      if (match) {
        io.to(room).emit("match:playerHasJoin", match);
      } else {
        logger.error(`Match not found for room ${room} after player join`);
      }
    } catch (e) {
      io.to(socket.id).emit("match:nameTaken", playerName);
      logger.info("name taken");
      return;
    }
  });

  socket.on("game:playerReady", () => {
    const { playerName, currentRoom } = socket.data;

    logger.info(`Player ready: ${playerName} in room ${currentRoom}`);

    if (!playerName || !currentRoom) {
      logger.warn(`missing data for player ready for ${socket.id}`);
      return;
    }

    try {
      gameService.playerReady(playerName, currentRoom);
    } catch (error) {
      logger.error(`room ${currentRoom}: couldn't set player ${playerName} ready`);
    }
  });

  socket.on("match:playerLeft", (data) => {
    const { playerName, room } = data;

    const match = matchService.playerLeave(playerName, room, socket);

    if (match) {
      io.to(room).emit("match:playerHasLeft", match);
    } else {
      // Room was deleted
      io.to(room).emit("match:roomDeleted", { room });
    }

    socket.leave(room);
  });

  socket.on("match:startGame", (data) => {
    const { room } = data;
    const playerName = socket.data.playerName;

    logger.info(`🚀 Start game requested for room: ${room} by player: ${playerName}`);

    if (!playerName) {
      logger.warn(`❌ No playerName found in socket data`);
      socket.emit("match:error", "Player not identified");
      return;
    }

    // Use the new canPlayerStartGame method
    if (!matchService.canPlayerStartGame(playerName, room)) {
      logger.warn(`❌ Player ${playerName} tried to start game in room ${room} but is not the leader`);
      socket.emit("match:error", "Only the room leader can start the game");
      return;
    }

    try {
      matchService.startGame(room);
      logger.info(`✅ Successfully called matchService.startGame for room: ${room} by leader: ${playerName}`);
    } catch (error) {
      logger.error(`❌ Error calling matchService.startGame for room ${room}:`, error);
      socket.emit("match:error", "Failed to start game");
    }
  });

  socket.on("disconnect", (reason) => {
    const playerName = socket.data.playerName;
    const room = socket.data.currentRoom;

    logger.info(`🔌 Socket ${socket.id} disconnected: ${reason}`);

    if (playerName && room) {
      logger.info(`👋 Player ${playerName} disconnected from room ${room}`);

      try {
        const match = matchService.playerLeave(playerName, room, socket);

        if (match) {
          io.to(room).emit("match:playerHasLeft", match);
        }

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
