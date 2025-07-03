// back/src/core/tetris/TetrisGameLoop.ts
import MyWebSocket from "../socket/websocket.js";
import { getLogger } from "../utils/Logger.js";
import { gameService } from "../game/GameService.js";

export class TetrisGameLoop {
  private gravityInterval: NodeJS.Timeout | null = null;
  private inputInterval: NodeJS.Timeout | null = null;
  private io: MyWebSocket;
  private logger = getLogger("TetrisGameLoop");
  private room: string;

  /** `initialGameState` is accepted for API-compat but managed inside GameService. */
  constructor(initialGameState: unknown, room: string) {
    this.room = room;
    this.io = MyWebSocket.getInstance();
    this.logger.info(`TetrisGameLoop created for room ${room}`);
  }

  /** Start two timers: one for rapid input polling, one for gravity/refresh. */
  start() {
    if (this.gravityInterval || this.inputInterval) {
      this.logger.warn(`Game ${this.room} already started`);
      return;
    }

    this.logger.info(`Starting game loop for room ${this.room}`);

    /* --- 20 ms input polling --- */
    this.inputInterval = setInterval(() => {
      this.processInputs();
    }, 20);

    /* --- 500 ms gravity & broadcast --- */
    this.gravityInterval = setInterval(() => {
      this.processGravity();
      this.sendGameState();
    }, 500);
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

  /* ---------- internal helpers ---------- */

  private processInputs() {
    const game = gameService.getGame(this.room);
    if (!game || !game.isRunning) {
      this.logger.info(`Game ${this.room} not running — stopping loop`);
      this.stop();
      return;
    }
    game.processPlayerInputsOnly();
  }

  private processGravity() {
    const game = gameService.getGame(this.room);
    if (!game || !game.isRunning) {
      this.logger.info(`Game ${this.room} not running — stopping loop`);
      this.stop();
      return;
    }
    game.processGravity();
  }

  private sendGameState() {
    gameService.sendGameState(this.room);
  }

  /* -- Optional one-shot updater retained for flexibility (unused by .start()) -- */
  updateGame() {
    const game = gameService.getGame(this.room);
    if (!game || !game.isRunning) {
      this.stop();
      return;
    }

    game.processPlayerActions();

    const hasGameOverPlayer = game
      .getGameState()
      .gamers?.some((g: any) =>
        [...Array(2).keys()].some((row) =>
          [...Array(10).keys()].some((col) => g.grid?.[row]?.[col] !== 0),
        ),
      );

    if (hasGameOverPlayer) {
      this.logger.info(`Game over detected in room ${this.room}`);
      game.stop();
      this.stop();
    }
  }
}
