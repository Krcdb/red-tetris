import MyWebSocket from "../socket/websocket";
import { Cell } from "../types/game";
import { getLogger } from "../utils/Logger";
import { gameService } from "../game/GameService";
import { Game } from "../classes/Game.js";

export class TetrisGameLoop {
  private game: Game;
  private io: MyWebSocket;
  private room: string;
  private interval: NodeJS.Timeout | null = null;
  private logger = getLogger("TetrisGameLoop");

  constructor(game: Game, room: string) {
    this.game = game;
    this.room = room;
    this.io = MyWebSocket.getInstance();
  }

  start() {
    if (this.interval) {
      this.logger.warn(`Game ${this.room} already started`);
      return;
    }

    this.logger.info(`Starting game loop for room ${this.room}`);

    this.interval = setInterval(() => {
      this.updateGame();
      gameService.sendGameState(this.room);
    }, 500);
  }

  updateGame() {
    if (!this.game.isRunning) return;

    this.game.processPlayerActions();
  }

  stop() {
    if (this.interval) {
      this.logger.info(`🛑 Stopping game loop for room ${this.room}`);
      clearInterval(this.interval);
      this.interval = null;
      this.game.stop();
      this.logger.info(`✅ Game loop for room ${this.room} stopped`);
    } else {
      this.logger.warn(`⚠️  Game loop for room ${this.room} was not running`);
    }
  }

  public forceSynchronization() {
    this.logger.info("🔄 Forcing piece synchronization for all players");

    this.game.players.forEach((player) => {
      if (!player.currentPiece) {
        this.game.giveNextPiece(player);
      }
    });

    gameService.sendGameState(this.room);
  }

  public getSynchronizationStatus() {
    const gameState = this.game.getGameState();
    const status = {
      currentPieceIndex: gameState.currentPieceIndex,
      totalSharedPieces: gameState.pieceSequenceLength,
      playersWithPieces: gameState.gamers.filter((g: any) => g.currentPiece).length,
      totalPlayers: gameState.gamers.length,
      pieceTypes: gameState.gamers.map((g: any) => g.currentPiece?.type || "none"),
    };

    this.logger.info(`📊 Synchronization status: ${JSON.stringify(status)}`);
    return status;
  }
}
