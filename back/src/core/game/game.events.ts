import { CustomeSocket } from "../types/socket-event";
import { getLogger } from "../utils/Logger";
import { gameService } from "./GameService";

export function registerGameHandler(socket: CustomeSocket) {
  const context = "GameHandler";
  const logger = getLogger(context);

  socket.on("game:playerReady", () => {
    logger.info(`Player ready: socket ${JSON.stringify(socket.data)}`);

    const { playerName, currentRoom } = socket.data;

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

  socket.on("game:playerInputChanges", (data) => {
    const { input } = data;
    const { playerName, currentRoom } = socket.data;

    if (!playerName || !currentRoom) {
      logger.warn(`missing data for player ready for ${socket.id}`);
      return;
    }

    try {
      gameService.playerInputChange(playerName, currentRoom, input);
    } catch (error) {
      logger.error(`room ${currentRoom}: couldn't set player ${playerName} ready`);
    }
  });

  socket.on("game:pieceLanded", () => {
    logger.info(`Piece landed: socket ${JSON.stringify(socket.data)}`);

    const { playerName, currentRoom } = socket.data;

    if (!playerName || !currentRoom) {
      logger.warn(`missing data for piece landed for ${socket.id}`);
      return;
    }

    try {
      // Server gives next piece from shared sequence
      const nextPiece = gameService.getNextPiece(currentRoom, playerName);
      if (nextPiece) {
        // Send updated game state to all players in room
        gameService.sendGameState(currentRoom);
        logger.info(`Gave next piece to ${playerName} in ${currentRoom}: ${nextPiece.type}`);
      }
    } catch (error) {
      logger.error(`room ${currentRoom}: couldn't get next piece for player ${playerName}`);
    }
  });

  logger.info("game handler registered");
}
