import MyWebSocket from "../socket/websocket";
import { getLogger } from "../utils/Logger";
import { gameService } from "../game/GameService";

export class TetrisGameLoop {
  private gravityInterval: NodeJS.Timeout | null = null;
  private inputInterval: NodeJS.Timeout | null = null;
  private io: MyWebSocket;
  private logger = getLogger("TetrisGameLoop");
  private room: string;

  constructor(initialGameState: any, room: string) {
    this.room = room;
    this.io = MyWebSocket.getInstance();

    this.logger.info(`TetrisGameLoop created for room ${room}`);
  }

  start() {
    if (this.gravityInterval || this.inputInterval) {
      this.logger.warn(`Game ${this.room} already started`);
      return;
    }

    this.logger.info(`Starting game loop for room ${this.room}`);

    this.inputInterval = setInterval(() => {
      this.processInputs();
    }, 20); 

    this.gravityInterval = setInterval(() => {
      this.processGravity();
      this.sendGameState();
    }, 500);
  }

  stop() {
    if (this.inputInterval) {
      clearInterval(this.inputInterval);
      this.inputInterval = null;
    }
    if (this.gravityInterval) {
      clearInterval(this.gravityInterval);
      this.gravityInterval = null;
    }
    this.logger.info(`Game loop stopped for room ${this.room}`);
  }

  processInputs() {
    const game = gameService.getGame(this.room);
    if (!game) {
      this.logger.warn(`Game not found for room ${this.room}, stopping loop`);
      this.stop();
      return;
    }
    if (!game.isRunning) {
      this.logger.info(`Game ${this.room} is not running, stopping loop`);
      this.stop();
      return;
    }
    game.processPlayerInputsOnly();
  }

  processGravity() {
    const game = gameService.getGame(this.room);
    if (!game) {
      this.logger.warn(`Game not found for room ${this.room}, stopping loop`);
      this.stop();
      return;
    }
    if (!game.isRunning) {
      this.logger.info(`Game ${this.room} is not running, stopping loop`);
      this.stop();
      return;
    }
    game.processGravity();
  }

  private sendGameState() {
    gameService.sendGameState(this.room);
  }

  updateGame() {
    const game = gameService.getGame(this.room);
    if (!game) {
      this.logger.warn(`Game not found for room ${this.room}, stopping loop`);
      this.stop();
      return;
    }

    if (!game.isRunning) {
      this.logger.info(`Game ${this.room} is not running, stopping loop`);
      this.stop();
      return;
    }

    game.processPlayerActions();

    const gameState = game.getGameState();
    const hasGameOverPlayer = gameState.gamers?.some((gamer: any) => {
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 10; col++) {
          if (gamer.grid && gamer.grid[row] && gamer.grid[row][col] !== 0) {
            return true;
          }
        }
      }
      return false;
    });

    if (hasGameOverPlayer) {
      this.logger.info(`Game over detected in room ${this.room}`);
      game.stop();
      this.stop();
    }
  }
}
