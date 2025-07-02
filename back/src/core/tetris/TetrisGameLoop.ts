// import MyWebSocket from "../socket/websocket";
// import { Cell } from "../types/game";
// import { getLogger } from "../utils/Logger";
// import { gameService } from "../game/GameService";
// import { Game } from "../classes/Game.js";

// export class TetrisGameLoop {
//   private game: Game;
//   private io: MyWebSocket;
//   private room: string;
//   private interval: NodeJS.Timeout | null = null;
//   private logger = getLogger("TetrisGameLoop");

//   constructor(game: Game, room: string) {
//     this.game = game;
//     this.room = room;
//     this.io = MyWebSocket.getInstance();
//   }

//   start() {
//     if (this.interval) {
//       this.logger.warn(`Game ${this.room} already started`);
//       return;
//     }

//     this.logger.info(`Starting game loop for room ${this.room}`);

//     this.interval = setInterval(() => {
//       this.updateGame();
//       gameService.sendGameState(this.room);
//     }, 500);
//   }

//   updateGame() {
//     if (!this.game.isRunning) return;

//     this.game.processPlayerActions();
//   }

//   stop() {
//     if (this.interval) {
//       this.logger.info(`🛑 Stopping game loop for room ${this.room}`);
//       clearInterval(this.interval);
//       this.interval = null;
//       this.game.stop();
//       this.logger.info(`✅ Game loop for room ${this.room} stopped`);
//     } else {
//       this.logger.warn(`⚠️  Game loop for room ${this.room} was not running`);
//     }
//   }

//   public forceSynchronization() {
//     this.logger.info("🔄 Forcing piece synchronization for all players");

//     this.game.players.forEach((player) => {
//       if (!player.currentPiece) {
//         this.game.giveNextPiece(player);
//       }
//     });

//     gameService.sendGameState(this.room);
//   }

//   public getSynchronizationStatus() {
//     const gameState = this.game.getGameState();
//     const status = {
//       currentPieceIndex: gameState.currentPieceIndex,
//       totalSharedPieces: gameState.pieceSequenceLength,
//       playersWithPieces: gameState.gamers.filter((g: any) => g.currentPiece).length,
//       totalPlayers: gameState.gamers.length,
//       pieceTypes: gameState.gamers.map((g: any) => g.currentPiece?.type || "none"),
//     };

//     this.logger.info(`📊 Synchronization status: ${JSON.stringify(status)}`);
//     return status;
//   }
// }

import MyWebSocket from "../socket/websocket";
import { getLogger } from "../utils/Logger";
import { gameService } from "../game/GameService";

export class TetrisGameLoop {
  // private interval: NodeJS.Timeout | null = null;
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

    // Fast input interval (responsive controls)
    this.inputInterval = setInterval(() => {
      this.processInputs();
      // this.sendGameState();
    }, 20); // 30ms for input

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
    // Only process player input (left/right/rotate)
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
    // Only process gravity (move piece down)
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

    // Process all player actions using the Game class
    game.processPlayerActions();

    // Check for game over conditions
    const gameState = game.getGameState();
    const hasGameOverPlayer = gameState.gamers?.some((gamer: any) => {
      // Simple game over check - if top 2 rows have pieces
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
