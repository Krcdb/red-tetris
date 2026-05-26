import { CustomeSocket } from "../types/socket-event";
import { getLogger } from "../utils/Logger";
import { gameService } from "./GameService";

export function registerGameHandler(socket: CustomeSocket) {
  const context = "GameHandler";
  const logger = getLogger(context);

  socket.on("game:playerReady", () => {
    logger.info(`Player ready: socket ${JSON.stringify(socket.data)}`);

    const { currentRoom, playerName } = socket.data;

    if (!playerName || !currentRoom) {
      logger.warn(`missing data for player ready for ${socket.id}`);
      return;
    }

    try {
      const game = gameService.getGame(currentRoom);
      if (game?.isRunning) {
        logger.info(`Game ${currentRoom} already running, ignoring ready from ${playerName}`);
        return;
      }
      gameService.playerReady(playerName, currentRoom);
    } catch {
      logger.error(`room ${currentRoom}: couldn't set player ${playerName} ready`);
    }
  });

  socket.on("game:playerInputChanges", (data) => {
    const { input } = data;
    const { currentRoom, playerName } = socket.data;

    if (!playerName || !currentRoom) {
      logger.warn(`missing data for player ready for ${socket.id}`);
      return;
    }

    try {
      gameService.playerInputChange(playerName, currentRoom, input);
    } catch {
      logger.error(`room ${currentRoom}: couldn't apply input for player ${playerName}`);
    }
  });

  logger.info("game handler registered");
}
