import MyWebSocket from "../socket/websocket.js";
import { Match } from "../types/match.js";
import { CustomeSocket } from "../types/socket-event.js";
import { getLogger } from "../utils/Logger.js";
import { matchService } from "./MatchService.js";

/**
 * Attach all match-related socket handlers for a single connection.
 * (Name kept as “registerMatchHanlder” to match existing imports.)
 */
export function registerMatchHanlder(io: MyWebSocket, socket: CustomeSocket) {
  const logger = getLogger("MatchHandler");

  socket.on("match:playerJoin", (data) => {
    const { playerName, room, gameMode } = data;
    let match: Match;

    try {
      match = matchService.playerJoin(playerName, room, socket, gameMode);
    } catch (error) {
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes("Name already taken")) {
          socket.emit("match:nameTaken", playerName);
          logger.info(`name taken: ${playerName}`);
        } else if (error.message.includes("game mode")) {
          // Emit the match:error event for game mode conflicts
          socket.emit("match:error", error.message);
          logger.info(`game mode conflict: ${error.message}`);
        } else {
          socket.emit("match:error", error.message);
          logger.error(`join error: ${error.message}`);
        }
      }
      return;
    }

    socket.join(room);
    io.to(room).emit("match:playerHasJoin", match);
  });

  socket.on("match:leaveCurrentRoom", () => {
    const { playerName, currentRoom } = socket.data;

    if (playerName && currentRoom) {
      logger.info(`Player ${playerName} explicitly leaving room ${currentRoom}`);

      const match = matchService.playerLeave(playerName, currentRoom, socket);

      if (match) {
        io.to(currentRoom).emit("match:playerHasLeft", match);
      } else {
        io.to(currentRoom).emit("match:roomDeleted", { room: currentRoom });
      }

      socket.leave(currentRoom);

      // Clear socket data completely
      socket.data.currentRoom = undefined;
      socket.data.playerName = undefined;
      socket.data.gameMode = undefined;
    }
  });

  socket.on("match:playerLeft", (data) => {
    const { playerName, room } = data;
    const match = matchService.playerLeave(playerName, room, socket);

    if (match) {
      io.to(room).emit("match:playerHasLeft", match);
    } else {
      io.to(room).emit("match:roomDeleted", { room });
    }
    socket.leave(room);
  });

  socket.on("match:startGame", (data) => {
    const { room } = data;
    matchService.startGame(room, socket);
  });

  socket.on("disconnect", (reason) => {
    logger.info(`Socket ${socket.id} disconnected: ${reason}`);

    const { playerName, currentRoom } = socket.data;

    if (playerName && currentRoom) {
      logger.info(`Cleaning up player ${playerName} from room ${currentRoom} due to disconnect`);
      matchService.playerLeave(playerName, currentRoom, socket);

      // Notify room of the disconnection
      const match = matchService.getMatch(currentRoom);
      if (match) {
        io.to(currentRoom).emit("match:playerHasLeft", match);
      } else {
        io.to(currentRoom).emit("match:roomDeleted", { room: currentRoom });
      }
    }

    matchService.handleDisconnect(socket, reason);
  });

  logger.info("match handler registered");
}
