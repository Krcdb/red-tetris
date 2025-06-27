import MyWebSocket from "../socket/websocket";
import { GameState, Cell } from "../types/game";
import { getLogger } from "../utils/Logger";
import { gameService } from "../game/GameService";
import { isValidPosition, mergePiece, clearLines, canMoveDown, rotatePiece } from "../utils/tetris";

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

    this.initializeSharedPieces();
  }

  private initializeSharedPieces() {
    if (!this.gameState.sharedPieces || this.gameState.sharedPieces.length === 0) {
      this.logger.info("Initializing shared pieces for synchronization");
      this.gameState.sharedPieces = this.generatePieceSequence(100);
      this.gameState.currentPieceIndex = 0;
    }
  }

  private generatePieceSequence(count: number) {
    const pieceTypes = ["I", "O", "T", "S", "Z", "J", "L"];
    const pieces = [];

    for (let i = 0; i < count; i++) {
      const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
      pieces.push({
        type,
        x: 4,
        y: 0,
        shape: this.getPieceShape(type),
        rotation: 0,
      });
    }

    return pieces;
  }

  private getPieceShape(type: string) {
    const shapes: { [key: string]: number[][] } = {
      I: [[1, 1, 1, 1]],
      O: [
        [1, 1],
        [1, 1],
      ],
      T: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      J: [
        [1, 0, 0],
        [1, 1, 1],
      ],
      L: [
        [0, 0, 1],
        [1, 1, 1],
      ],
    };
    return shapes[type] || shapes["T"];
  }

  start() {
    if (this.interval) {
      this.logger.warn(`Game ${this.room} already started`);
      return;
    }

    this.gameState.isRunning = true;
    this.logger.info(`Starting game loop for room ${this.room}`);

    this.synchronizeInitialPieces();

    this.interval = setInterval(() => {
      this.updateGame();
      gameService.sendGameState(this.room);
    }, 500);
  }

  private synchronizeInitialPieces() {
    if (!this.gameState.sharedPieces || this.gameState.sharedPieces.length === 0) {
      this.logger.error("No shared pieces available for synchronization!");
      return;
    }

    const initialPiece = this.gameState.sharedPieces[0];
    this.logger.info(`🎯 Synchronizing initial piece: ${initialPiece.type} for all players`);

    this.gameState.gamers.forEach((gamer) => {
      if (!gamer.currentPiece) {
        gamer.currentPiece = {
          type: initialPiece.type,
          x: initialPiece.x,
          y: initialPiece.y,
          shape: [...initialPiece.shape.map((row) => [...row])],
          rotation: initialPiece.rotation || 0,
        };
        gamer.currentPieceIndex = 0;
        this.logger.info(`✅ Gave initial ${initialPiece.type} (index 0) to ${gamer.name}`);
      }
    });

    this.gameState.currentPieceIndex = 1;
  }

  stop() {
    if (this.interval) {
      this.logger.info(`🛑 Stopping game loop for room ${this.room}`);
      clearInterval(this.interval);
      this.interval = null;
      this.gameState.isRunning = false;
      this.logger.info(`✅ Game loop for room ${this.room} stopped`);
    } else {
      this.logger.warn(`⚠️  Game loop for room ${this.room} was not running`);
    }
  }

  updateGame() {
    this.logger.info(`=== UPDATE GAME TICK FOR ROOM ${this.room} ===`);
    this.logger.info(`📊 Current piece index: ${this.gameState.currentPieceIndex}`);

    const playersNeedingNewPieces: string[] = [];

    this.gameState.gamers.forEach((gamer, index) => {
      this.logger.info(`Processing player ${index + 1}: ${gamer.name}`);

      if (!gamer.currentPiece) {
        this.logger.warn(`  No current piece for ${gamer.name} - marking for new piece`);
        playersNeedingNewPieces.push(gamer.name);
        return;
      }

      let hasMoved = false;
      let wasAtBottom = !canMoveDown(gamer.grid, gamer.currentPiece);

      if (gamer.input.up && !gamer.input.upHasBeenCounted) {
        this.logger.info(`  🔄 Rotating ${gamer.name}'s piece`);
        const rotatedPiece = rotatePiece(gamer.currentPiece);
        if (isValidPosition(gamer.grid, rotatedPiece)) {
          gamer.currentPiece = rotatedPiece;
          hasMoved = true;
        }
        gamer.input.upHasBeenCounted = true;
      }

      if (gamer.input.left && !gamer.forcedFall) {
        this.logger.info(`  🔹 Moving ${gamer.name} LEFT`);
        const testPiece = { ...gamer.currentPiece, x: gamer.currentPiece.x - 1 };
        if (isValidPosition(gamer.grid, testPiece)) {
          gamer.currentPiece.x -= 1;
          hasMoved = true;
        }
        gamer.input.left = false;
      }

      if (gamer.input.right && !gamer.forcedFall) {
        this.logger.info(`  🔹 Moving ${gamer.name} RIGHT`);
        const testPiece = { ...gamer.currentPiece, x: gamer.currentPiece.x + 1 };
        if (isValidPosition(gamer.grid, testPiece)) {
          gamer.currentPiece.x += 1;
          hasMoved = true;
        }
        gamer.input.right = false;
      }

      if (gamer.input.down) {
        this.logger.info(`  🔹 Soft dropping ${gamer.name}'s piece`);

        let dropCount = 0;
        while (gamer.input.down && dropCount < 3 && canMoveDown(gamer.grid, gamer.currentPiece)) {
          gamer.currentPiece.y += 1;
          dropCount++;
          hasMoved = true;
        }

        gamer.input.down = false;
      }

      if (gamer.input.space && !gamer.input.spaceHasBeenCounted) {
        this.logger.info(`  🔹 Hard dropping ${gamer.name}'s piece`);
        while (canMoveDown(gamer.grid, gamer.currentPiece)) {
          gamer.currentPiece.y += 1;
        }
        gamer.input.spaceHasBeenCounted = true;
        gamer.forcedFall = true;
        hasMoved = true;
      }

      if (!hasMoved && canMoveDown(gamer.grid, gamer.currentPiece)) {
        this.logger.info(`  🔹 Auto-dropping ${gamer.name}'s piece`);
        gamer.currentPiece.y += 1;
      }

      if (!canMoveDown(gamer.grid, gamer.currentPiece)) {
        if (wasAtBottom && !hasMoved) {
          this.logger.info(`  🎯 Piece locked for ${gamer.name} - merging into board`);

          gamer.grid = mergePiece(gamer.grid, gamer.currentPiece);

          const { newBoard, linesCleared } = clearLines(gamer.grid);
          gamer.grid = newBoard;
          gamer.linesCleared += linesCleared;
          gamer.score += linesCleared * 100 + (linesCleared >= 4 ? 400 : 0);

          this.logger.info(`  📋 Merged piece into board, cleared ${linesCleared} lines`);

          if (linesCleared > 1) {
            this.logger.info(`  🚨 Sending ${linesCleared - 1} penalty lines to opponents`);

            this.gameState.gamers.forEach((opponent) => {
              if (opponent.name !== gamer.name) {
                const penaltyLines = Array.from(
                  { length: linesCleared - 1 },
                  () => Array(10).fill(1), // Indestructible penalty lines
                );
                opponent.grid = penaltyLines.concat(opponent.grid.slice(0, 20 - penaltyLines.length));
              }
            });
          }

          if (this.isGameOver(gamer.grid)) {
            this.logger.info(`💀 Game over for ${gamer.name}!`);
            this.gameState.isRunning = false;
            this.stop();
            return;
          }

          gamer.currentPiece = null;
          gamer.forcedFall = false;
          playersNeedingNewPieces.push(gamer.name);
        } else {
          this.logger.info(`  🕹 Piece landed but allowing movement for ${gamer.name}`);
        }
      } else {
        gamer.forcedFall = false;
      }

      this.logger.info(`  After: ${gamer.currentPiece?.type} at (${gamer.currentPiece?.x}, ${gamer.currentPiece?.y})`);
    });

    this.distributeSynchronizedPieces(playersNeedingNewPieces);

    this.logger.info(`=== END UPDATE GAME TICK ===`);
  }

  private isGameOver(grid: Cell[][]): boolean {
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  private distributeSynchronizedPieces(playersNeedingNewPieces: string[]) {
    if (playersNeedingNewPieces.length === 0) {
      return;
    }

    this.logger.info(`🎯 Players requesting pieces: ${playersNeedingNewPieces.join(", ")}`);

    if (this.gameState.sharedPieces.length < 1000) {
      const newPieces = this.generatePieceSequence(1000);
      this.gameState.sharedPieces.push(...newPieces);
      this.logger.info(`🔄 Extended piece sequence to ${this.gameState.sharedPieces.length} pieces`);
    }

    playersNeedingNewPieces.forEach((playerName) => {
      const gamer = this.gameState.gamers.find((g) => g.name === playerName);
      if (gamer) {
        const nextPieceIndex = (gamer.currentPieceIndex ?? -1) + 1;
        const nextPiece = this.gameState.sharedPieces[nextPieceIndex];

        if (nextPiece) {
          gamer.currentPiece = this.clonePiece(nextPiece);
          gamer.currentPieceIndex = nextPieceIndex;
          gamer.needsNextPiece = false;

          this.logger.info(`✅ ${playerName}: Piece #${nextPieceIndex} (${nextPiece.type})`);
        } else {
          this.logger.error(`❌ No piece available at index ${nextPieceIndex} for ${playerName}`);
        }
      }
    });
  }

  public forceSynchronization() {
    this.logger.info("🔄 Forcing piece synchronization for all players");

    const playersNeedingSync = this.gameState.gamers.map((g) => g.name);
    this.distributeSynchronizedPieces(playersNeedingSync);

    gameService.sendGameState(this.room);
  }

  private clonePiece(piece: any) {
    return {
      type: piece.type,
      x: piece.x,
      y: piece.y,
      shape: piece.shape.map((row: any[]) => [...row]),
      rotation: piece.rotation || 0,
    };
  }

  public getSynchronizationStatus() {
    const status = {
      currentPieceIndex: this.gameState.currentPieceIndex,
      totalSharedPieces: this.gameState.sharedPieces.length,
      playersWithPieces: this.gameState.gamers.filter((g) => g.currentPiece).length,
      totalPlayers: this.gameState.gamers.length,
      pieceTypes: this.gameState.gamers.map((g) => g.currentPiece?.type || "none"),
    };

    this.logger.info(`📊 Synchronization status: ${JSON.stringify(status)}`);
    return status;
  }
}
