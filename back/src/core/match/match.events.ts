// back/src/core/match/match.events.ts
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

  /* -------- player joins a lobby -------- */
  socket.on("match:playerJoin", (data) => {
    const { playerName, room } = data;
    let match: Match;

    try {
      match = matchService.playerJoin(playerName, room, socket);
    } catch {
      socket.emit("match:nameTaken", playerName);
      logger.info(`name taken: ${playerName}`);
      return;
    }

    socket.join(room);
    io.to(room).emit("match:playerHasJoin", match);
  });

  /* -------- player leaves a lobby -------- */
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

  /* -------- leader starts the game -------- */
  socket.on("match:startGame", (data) => {
    const { room } = data;
    matchService.startGame(room, socket); // Validation happens inside MatchService
  });

  /* -------- socket disconnect cleanup -------- */
  socket.on("disconnect", (reason) => {
    matchService.handleDisconnect(socket, reason);
  });

  logger.info("match handler registered");
}
