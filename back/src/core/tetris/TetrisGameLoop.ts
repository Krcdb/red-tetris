import MyWebSocket from "../socket/websocket";
import { GameState } from "../types/game";
import { getLogger } from "../utils/Logger";
import { gameService } from "../game/GameService";

export class TetrisGameLoop {
  private gameState: GameState;
  private io: MyWebSocket;
  private room: string;
  private interval: NodeJS.Timeout | null = null;
  private logger = getLogger("TetrisGameLoop");

  constructor(initialState: GameState, room: string) {
    this.gameState = initialState;
    this.room = room;
    this.io = MyWebSocket.getInstance();
  }

  start() {
    if (this.interval) {
      this.logger.warn(`Game ${this.room} already started`);
      return;
    }

    this.gameState.isRunning = true;
    this.logger.info(`Starting game loop for room ${this.room}`);

    // Server-side auto-drop every 1000ms
    this.interval = setInterval(() => {
      this.updateGame();
      gameService.sendGameState(this.room);
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.gameState.isRunning = false;
    this.logger.info(`Stopped game loop for room ${this.room}`);
  }

  updateGame() {
    this.logger.info(`=== UPDATE GAME TICK FOR ROOM ${this.room} ===`);

    this.gameState.gamers.forEach((gamer, index) => {
      this.logger.info(`Processing player ${index + 1}: ${gamer.name}`);

      if (!gamer.currentPiece) {
        this.logger.warn(`  No current piece for ${gamer.name}`);
        return;
      }

      this.logger.info(`  Before: ${gamer.currentPiece.type} at (${gamer.currentPiece.x}, ${gamer.currentPiece.y})`);
      this.logger.info(`  Input: ${JSON.stringify(gamer.input)}`);

      // Handle player inputs FIRST
      let hasMoved = false;

      if (gamer.input.left) {
        this.logger.info(`  🔹 Moving ${gamer.name} LEFT`);
        if (gamer.currentPiece.x > 0) {
          gamer.currentPiece.x -= 1;
          hasMoved = true;
        }
        gamer.input.left = false;
      }

      if (gamer.input.right) {
        this.logger.info(`  🔹 Moving ${gamer.name} RIGHT`);
        if (gamer.currentPiece.x < 8) {
          gamer.currentPiece.x += 1;
          hasMoved = true;
        }
        gamer.input.right = false;
      }

      if (gamer.input.up && !gamer.input.upHasBeenCounted) {
        this.logger.info(`  🔹 Rotating ${gamer.name}'s piece`);
        gamer.input.upHasBeenCounted = true;
        hasMoved = true;
      }

      if (gamer.input.down) {
        this.logger.info(`  🔹 Soft dropping ${gamer.name}'s piece`);
        if (gamer.currentPiece.y < 18) {
          gamer.currentPiece.y += 1;
          hasMoved = true;
        }
        gamer.input.down = false;
      }

      if (gamer.input.space && !gamer.input.spaceHasBeenCounted) {
        this.logger.info(`  🔹 Hard dropping ${gamer.name}'s piece`);
        gamer.currentPiece.y = 18;
        gamer.input.spaceHasBeenCounted = true;
        hasMoved = true;
      }

      // Auto-drop: Move piece down by 1 (only if no manual input)
      if (!hasMoved && gamer.currentPiece.y < 18) {
        this.logger.info(`  🔹 Auto-dropping ${gamer.name}'s piece`);
        gamer.currentPiece.y += 1;
      }

      // Check if piece has landed (simplified)
      if (gamer.currentPiece.y >= 18) {
        this.logger.info(`  🎯 Piece landed for ${gamer.name}, giving next piece`);
        // Use the imported gameService (no require needed)
        gameService.getNextPiece(this.room, gamer.name);
      }

      this.logger.info(`  After: ${gamer.currentPiece.type} at (${gamer.currentPiece.x}, ${gamer.currentPiece.y})`);
    });

    this.logger.info(`=== END UPDATE GAME TICK ===`);
  }
}
