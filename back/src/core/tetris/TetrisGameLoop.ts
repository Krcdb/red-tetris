import { gameService } from "../game/GameService.js";
import MyWebSocket from "../socket/websocket.js";
import { getLogger } from "../utils/Logger.js";

export class TetrisGameLoop {
  private gameMode = "normal";
  private gravityInterval: NodeJS.Timeout | null = null;
  private inputInterval: NodeJS.Timeout | null = null;
  private io: MyWebSocket;
  private logger = getLogger("TetrisGameLoop");
  private room: string;

  /** `initialGameState` is accepted for API-compat but managed inside GameService. */
  constructor(initialGameState: unknown, room: string, gameMode?: string) {
    this.room = room;
    this.gameMode = gameMode || "normal";
    this.io = MyWebSocket.getInstance();
    this.logger.info(`TetrisGameLoop created for room ${room}, with mode ${this.gameMode}`);
  }

  /** Start two timers: one for rapid input polling, one for gravity/refresh. */
  start() {
    if (this.gravityInterval || this.inputInterval) {
      this.logger.warn(`Game ${this.room} already started`);
      return;
    }

    this.logger.info(`Starting game loop for room ${this.room}`);

    // /* --- 20 ms input polling --- */
    this.inputInterval = setInterval(() => {
      this.processInputs();
      this.sendGameState();
    }, 100);

    this.gravityInterval = setInterval(() => {
      this.processGravity();
      this.sendGameState();
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

  /* -- Optional one-shot updater retained for flexibility (unused by .start()) -- */
  updateGame() {
    const game = gameService.getGame(this.room);
    if (!game?.isRunning) {
      this.stop();
      return;
    }

    game.processPlayerActions();

    const hasGameOverPlayer = game
      .getGameState()
      .gamers?.some((g: any) => [...Array(2).keys()].some((row) => [...Array(10).keys()].some((col) => g.grid?.[row]?.[col] !== 0)));

    if (hasGameOverPlayer) {
      this.logger.info(`Game over detected in room ${this.room}`);
      game.stop();
      this.stop();
    }
  }

  private getGameMode(): string {
    return this.gameMode;
  }

  /* ---------- internal helpers ---------- */

  private getGravitySpeed(): number {
    const gameMode = this.getGameMode();
    const game = gameService.getGame(this.room);

    switch (gameMode) {
      case "speed":
        // Get average lines cleared across all players
        let avgLines = 0;
        if (game && Array.isArray(game.players) && game.players.length > 0) {
          avgLines = game.players.reduce((sum, p) => sum + p.linesCleared, 0) / game.players.length;
        }
        // Start at 200ms, get faster every 10 lines
        return Math.max(30, 150 - Math.floor(avgLines / 10) * 15);
      default:
        return 500;
    }
  }

  private processGravity() {
    const game = gameService.getGame(this.room);
    if (!game?.isRunning) {
      this.logger.info(`Game ${this.room} not running — stopping loop`);
      this.stop();
      return;
    }
    game.processGravity();
  }

  private processInputs() {
    const game = gameService.getGame(this.room);
    if (!game?.isRunning) {
      this.logger.info(`Game ${this.room} not running — stopping loop`);
      this.stop();
      return;
    }
    game.processPlayerInputsOnly();
  }

  private sendGameState() {
    gameService.sendGameState(this.room);
  }
}
