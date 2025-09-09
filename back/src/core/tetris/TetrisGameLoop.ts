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

  constructor(initialGameState: unknown, room: string, gameMode?: string) {
    this.room = room;
    this.gameMode = gameMode ?? "normal";
    this.io = MyWebSocket.getInstance();

    console.log(`🎯 TETRIS GAME LOOP CONSTRUCTOR:`);
    console.log(`  - Room: ${room}`);
    console.log(`  - GameMode parameter: "${gameMode ?? "undefined"}"`);
    console.log(`  - Final this.gameMode: "${this.gameMode}"`);

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

  /* -- Optional one-shot updater retained for flexibility (unused by .start()) -- */
  updateGame() {
    const game = gameService.getGame(this.room);
    if (!game?.isRunning) {
      this.stop();
      return;
    }

    game.processPlayerActions();

    // Define types for gamers and grid
    interface Gamer {
      grid: number[][];
    }

    interface GameState {
      gamers?: Gamer[];
    }

    const gameState: GameState = game.getGameState() as GameState;
    const hasGameOverPlayer = gameState.gamers?.some((g) =>
      Array.from({ length: 2 }).some((_, row) =>
        Array.from({ length: 10 }).some((_, col) => g.grid[row]?.[col] !== 0),
      ),
    );

    if (hasGameOverPlayer) {
      this.logger.info(`Game over detected in room ${this.room}`);
      game.stop();
      this.stop();
    }
  }

  private getGameMode(): string {
    return this.gameMode;
  }

  private getGravitySpeed(): number {
    const gameMode = this.getGameMode();
    const game = gameService.getGame(this.room);

    console.log(`🎯 GRAVITY SPEED DEBUG:`);
    console.log(`  - Room: ${this.room}`);
    console.log(`  - Game mode from this.gameMode: "${this.gameMode}"`);
    console.log(`  - Game mode from getGameMode(): "${gameMode}"`);
    console.log(`  - Game exists: ${!!game}`);
    if (game) {
      console.log(`  - Game.gameMode: "${game.gameMode}"`);
      console.log(`  - Game.isRunning: ${game.isRunning}`);
      console.log(`  - Game.players.length: ${game.players.length}`);
    }

    switch (gameMode) {
      case "speed": {
        console.log(`🏃 ENTERING SPEED MODE CASE`);
        // Get average lines cleared across all players
        let avgLines = 0;
        if (game && Array.isArray(game.players) && game.players.length > 0) {
          const totalLines = game.players.reduce((sum, p) => sum + p.linesCleared, 0);
          avgLines = totalLines / game.players.length;

          // 🔍 Debug logging
          console.log(`🏃 SPEED MODE DEBUG:`);
          console.log(`  - Room: ${this.room}`);
          console.log(`  - Players: ${game.players.length.toString()}`);
          console.log(
            `  - Individual lines cleared:`,
            game.players.map((p) => `${p.name}: ${p.linesCleared.toString()}`),
          );
          console.log(`  - Total lines: ${totalLines.toString()}`);
          console.log(`  - Average lines: ${avgLines.toString()}`);
        } else {
          console.log(`🏃 SPEED MODE: No game or players found`);
        }

        const calculatedSpeed = Math.max(30, 100 - Math.floor(avgLines / 10) * 10);

        // 🔍 More debug logging
        console.log(`  - Floor(avgLines / 20): ${Math.floor(avgLines / 20).toString()}`);
        console.log(`  - Speed calculation: Math.max(15, 30 - ${Math.floor(avgLines / 20).toString()} * 3) = ${calculatedSpeed.toString()}ms`);
        console.log(`  - Normal mode speed: 500ms`);
        console.log(`  - Speed difference: ${(((500 - calculatedSpeed) / 500) * 100).toFixed(1)}% faster`);

        return calculatedSpeed;
      }
      default: {
        console.log(`🎮 ENTERING DEFAULT CASE (should be normal mode)`);
        const normalSpeed = 500;
        console.log(`🎮 NORMAL MODE: ${normalSpeed.toString()}ms`);
        return normalSpeed;
      }
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

  private updateGravityInterval() {
    if (!this.gravityInterval) return;

    const newSpeed = this.getGravitySpeed();

    console.log(`🔄 UPDATING GRAVITY INTERVAL:`);
    console.log(`  - Previous interval was running`);
    console.log(`  - New speed: ${newSpeed.toString()}ms`);

    clearInterval(this.gravityInterval);
    this.gravityInterval = setInterval(() => {
      this.processGravity();
      this.sendGameState();
    }, newSpeed);

    console.log(`  - ✅ Gravity interval restarted with ${newSpeed.toString()}ms`);
  }
}
