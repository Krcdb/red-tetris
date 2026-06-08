import { gameService } from "../game/GameService";
import MyWebSocket from "../socket/websocket";
import { getLogger } from "../utils/Logger";

export class TetrisGameLoop {
  private gameMode = "normal";
  private gravityInterval: NodeJS.Timeout | null = null;
  private inputInterval: NodeJS.Timeout | null = null;
  private io: MyWebSocket;
  private logger = getLogger("TetrisGameLoop");
  private room: string;

  constructor(room: string, gameMode?: string) {
    this.room = room;
    this.gameMode = gameMode ?? "normal";
    this.io = MyWebSocket.getInstance();

    this.logger.info(`TetrisGameLoop created for room ${room}, with mode ${this.gameMode}`);
  }

  start() {
    if (this.gravityInterval || this.inputInterval) {
      this.logger.warn(`Game ${this.room} already started`);
      return;
    }

    this.logger.info(`Starting game loop for room ${this.room}`);

    this.inputInterval = setInterval(() => {
      this.processInputs();
      this.sendGameState();
    }, 100);

    this.gravityInterval = setInterval(() => {
      this.processGravity();
      this.sendGameState();

      // Update speed dynamically in speed mode
      if (this.gameMode === "speed") {
        this.updateGravityInterval();
      }
    }, this.getGravitySpeed());
  }

  /** Clear both timers and mark loop stopped. */
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

  private getGravitySpeed(): number {
    const gameMode = this.gameMode;
    const game = gameService.getGame(this.room);

    switch (gameMode) {
      case "speed": {
        let avgLines = 0;
        if (game && Array.isArray(game.players) && game.players.length > 0) {
          const totalLines = game.players.reduce((sum, p) => sum + p.linesCleared, 0);
          avgLines = totalLines / game.players.length;
        }

        return Math.max(30, 100 - Math.floor(avgLines / 10) * 10);
      }
      default: {
        return 500;
      }
    }
  }

  /** Return the running game, or stop the loop and return null if it has ended. */
  private getRunningGame() {
    const game = gameService.getGame(this.room);
    if (!game?.isRunning) {
      this.logger.info(`Game ${this.room} not running — stopping loop`);
      this.stop();
      return null;
    }
    return game;
  }

  private processGravity() {
    const game = this.getRunningGame();
    if (!game) return;
    game.processGravity();
  }

  private processInputs() {
    const game = this.getRunningGame();
    if (!game) return;
    game.processPlayerInputsOnly();
  }

  private sendGameState() {
    gameService.sendGameState(this.room);
  }

  private updateGravityInterval() {
    if (!this.gravityInterval) return;

    const newSpeed = this.getGravitySpeed();

    clearInterval(this.gravityInterval);
    this.gravityInterval = setInterval(() => {
      this.processGravity();
      this.sendGameState();
    }, newSpeed);
  }
}
