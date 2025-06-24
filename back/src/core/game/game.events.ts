import MyWebSocket from "../socket/websocket";
import { CustomeSocket } from "../types/socket-event";
import { getLogger } from "../utils/Logger";
import { gameService } from "./GameService";

export function registerGameHandler(io: MyWebSocket, socket: CustomeSocket) {
  const context = "GameHandler";
  const logger = getLogger(context);

  socket.on("game:playerReady", () => {
    const { playerName, currentRoom } = socket.data

    if (!playerName || !currentRoom ) {
      logger.warn(`missing data for player ready for ${socket.id}`);
      return ;
    }

    try {
      gameService.playerReady(playerName, currentRoom);
    } catch (error) {
      logger.error(`room ${currentRoom}: couldn't set player ${playerName} ready`);
    }
  });

  socket.on("game:playerInputChanges", (data) => {
    const { input } = data;
    const { playerName, currentRoom } = socket.data

    if (!playerName || !currentRoom ) {
      logger.warn(`missing data for player ready for ${socket.id}`);
      return ;
    }

    try {
      gameService.playerInputChange(playerName, currentRoom, input);
    } catch (error) {
      logger.error(`room ${currentRoom}: couldn't set player ${playerName} ready`);
    }
  });

  logger.info("game handler registered");
}