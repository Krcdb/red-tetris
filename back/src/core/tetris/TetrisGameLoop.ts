// import MyWebSocket from "../socket/websocket";
// import { GameState } from "../types/game";
// import { getLogger } from "../utils/Logger";
// import { gameService } from "../game/GameService";
// import { isValidPosition, mergePiece, clearLines, canMoveDown, rotatePiece } from "../utils/tetris";

// export class TetrisGameLoop {
//   private gameState: GameState;
//   private io: MyWebSocket;
//   private room: string;
//   private interval: NodeJS.Timeout | null = null;
//   private logger = getLogger("TetrisGameLoop");

//   constructor(initialState: GameState, room: string) {
//     this.gameState = initialState;
//     this.room = room;
//     this.io = MyWebSocket.getInstance();
//   }

//   start() {
//     if (this.interval) {
//       this.logger.warn(`Game ${this.room} already started`);
//       return;
//     }

//     this.gameState.isRunning = true;
//     this.logger.info(`Starting game loop for room ${this.room}`);

//     // Reduce frequency to prevent overwhelming clients
//     this.interval = setInterval(() => {
//       this.updateGame();
//       // Only send state if something actually changed
//       gameService.sendGameState(this.room);
//     }, 1000); // Back to 1000ms to reduce network traffic
//   }

//   // stop() {
//   //   if (this.interval) {
//   //     clearInterval(this.interval);
//   //     this.interval = null;
//   //   }
//   //   this.gameState.isRunning = false;
//   //   this.logger.info(`Stopped game loop for room ${this.room}`);
//   // }

//   stop() {
//     if (this.interval) {
//       this.logger.info(`🛑 Stopping game loop for room ${this.room}`);
//       clearInterval(this.interval);
//       this.interval = null;
//       this.gameState.isRunning = false;
//       this.logger.info(`✅ Game loop for room ${this.room} stopped`);
//     } else {
//       this.logger.warn(`⚠️  Game loop for room ${this.room} was not running`);
//     }
//   }

//   // updateGame() {
//   //   this.logger.info(`=== UPDATE GAME TICK FOR ROOM ${this.room} ===`);

//   //   this.gameState.gamers.forEach((gamer, index) => {
//   //     this.logger.info(`Processing player ${index + 1}: ${gamer.name}`);

//   //     if (!gamer.currentPiece) {
//   //       this.logger.warn(`  No current piece for ${gamer.name}`);
//   //       return;
//   //     }

//   //     this.logger.info(`  Before: ${gamer.currentPiece.type} at (${gamer.currentPiece.x}, ${gamer.currentPiece.y})`);
//   //     this.logger.info(`  Input: ${JSON.stringify(gamer.input)}`);

//   //     // Handle player inputs FIRST
//   //     let hasMoved = false;

//   //     if (gamer.input.left) {
//   //       this.logger.info(`  🔹 Moving ${gamer.name} LEFT`);
//   //       if (gamer.currentPiece.x > 0) {
//   //         gamer.currentPiece.x -= 1;
//   //         hasMoved = true;
//   //       }
//   //       gamer.input.left = false;
//   //     }

//   //     if (gamer.input.right) {
//   //       this.logger.info(`  🔹 Moving ${gamer.name} RIGHT`);
//   //       if (gamer.currentPiece.x < 8) {
//   //         gamer.currentPiece.x += 1;
//   //         hasMoved = true;
//   //       }
//   //       gamer.input.right = false;
//   //     }

//   //     if (gamer.input.up && !gamer.input.upHasBeenCounted) {
//   //       this.logger.info(`  🔹 Rotating ${gamer.name}'s piece`);
//   //       gamer.input.upHasBeenCounted = true;
//   //       hasMoved = true;
//   //     }

//   //     if (gamer.input.down) {
//   //       this.logger.info(`  🔹 Soft dropping ${gamer.name}'s piece`);
//   //       if (gamer.currentPiece.y < 18) {
//   //         gamer.currentPiece.y += 1;
//   //         hasMoved = true;
//   //       }
//   //       gamer.input.down = false;
//   //     }

//   //     if (gamer.input.space && !gamer.input.spaceHasBeenCounted) {
//   //       this.logger.info(`  🔹 Hard dropping ${gamer.name}'s piece`);
//   //       gamer.currentPiece.y = 18;
//   //       gamer.input.spaceHasBeenCounted = true;
//   //       hasMoved = true;
//   //     }

//   //     // Auto-drop: Move piece down by 1 (only if no manual input)
//   //     if (!hasMoved && gamer.currentPiece.y < 18) {
//   //       this.logger.info(`  🔹 Auto-dropping ${gamer.name}'s piece`);
//   //       gamer.currentPiece.y += 1;
//   //     }

//   //     // Check if piece has landed (simplified)
//   //     if (gamer.currentPiece.y >= 18) {
//   //       this.logger.info(`  🎯 Piece landed for ${gamer.name}, giving next piece`);
//   //       // Use the imported gameService (no require needed)
//   //       gameService.getNextPiece(this.room, gamer.name);
//   //     }

//   //     this.logger.info(`  After: ${gamer.currentPiece.type} at (${gamer.currentPiece.x}, ${gamer.currentPiece.y})`);
//   //   });

//   //   this.logger.info(`=== END UPDATE GAME TICK ===`);
//   // }
//   updateGame() {
//     this.logger.info(`=== UPDATE GAME TICK FOR ROOM ${this.room} ===`);

//     const playersNeedingNewPieces: string[] = [];

//     this.gameState.gamers.forEach((gamer, index) => {
//       this.logger.info(`Processing player ${index + 1}: ${gamer.name}`);

//       // If player doesn't have a piece, they need one
//       if (!gamer.currentPiece) {
//         this.logger.warn(`  No current piece for ${gamer.name} - marking for new piece`);
//         playersNeedingNewPieces.push(gamer.name);
//         return;
//       }

//       let hasMoved = false;

//       // Handle inputs with proper collision detection
//       if (gamer.input.up && !gamer.input.upHasBeenCounted) {
//         this.logger.info(`  🔄 Rotating ${gamer.name}'s piece`);
//         const rotatedPiece = rotatePiece(gamer.currentPiece);
//         if (isValidPosition(gamer.grid, rotatedPiece)) {
//           gamer.currentPiece = rotatedPiece;
//           hasMoved = true;
//         }
//         gamer.input.upHasBeenCounted = true;
//       }

//       if (gamer.input.left) {
//         this.logger.info(`  🔹 Moving ${gamer.name} LEFT`);
//         const testPiece = { ...gamer.currentPiece, x: gamer.currentPiece.x - 1 };
//         if (isValidPosition(gamer.grid, testPiece)) {
//           gamer.currentPiece.x -= 1;
//           hasMoved = true;
//         }
//         gamer.input.left = false;
//       }

//       if (gamer.input.right) {
//         this.logger.info(`  🔹 Moving ${gamer.name} RIGHT`);
//         const testPiece = { ...gamer.currentPiece, x: gamer.currentPiece.x + 1 };
//         if (isValidPosition(gamer.grid, testPiece)) {
//           gamer.currentPiece.x += 1;
//           hasMoved = true;
//         }
//         gamer.input.right = false;
//       }

//       if (gamer.input.down) {
//         this.logger.info(`  🔹 Soft dropping ${gamer.name}'s piece`);
//         const testPiece = { ...gamer.currentPiece, y: gamer.currentPiece.y + 1 };
//         if (isValidPosition(gamer.grid, testPiece)) {
//           gamer.currentPiece.y += 1;
//           hasMoved = true;
//         }
//         gamer.input.down = false;
//       }

//       if (gamer.input.space && !gamer.input.spaceHasBeenCounted) {
//         this.logger.info(`  🔹 Hard dropping ${gamer.name}'s piece`);
//         while (canMoveDown(gamer.grid, gamer.currentPiece)) {
//           gamer.currentPiece.y += 1;
//         }
//         gamer.input.spaceHasBeenCounted = true;
//         hasMoved = true;
//       }

//       // Auto-drop: Only if no manual input happened
//       if (!hasMoved && canMoveDown(gamer.grid, gamer.currentPiece)) {
//         this.logger.info(`  🔹 Auto-dropping ${gamer.name}'s piece`);
//         gamer.currentPiece.y += 1;
//       }

//       // Check if piece has landed
//       if (!canMoveDown(gamer.grid, gamer.currentPiece)) {
//         this.logger.info(`  🎯 Piece landed for ${gamer.name} - merging into board`);

//         // Merge piece into grid
//         gamer.grid = mergePiece(gamer.grid, gamer.currentPiece);

//         // Clear completed lines
//         const { newBoard, linesCleared } = clearLines(gamer.grid);
//         gamer.grid = newBoard;
//         gamer.linesCleared += linesCleared;
//         gamer.score += linesCleared * 100 + (linesCleared >= 4 ? 400 : 0);

//         this.logger.info(`  📋 Merged piece into board, cleared ${linesCleared} lines`);

//         // Clear current piece - they'll get new one in batch
//         gamer.currentPiece = null;
//         playersNeedingNewPieces.push(gamer.name);
//       }

//       this.logger.info(`  After: ${gamer.currentPiece?.type} at (${gamer.currentPiece?.x}, ${gamer.currentPiece?.y})`);
//     });

//     // Give pieces to ALL players who need them - they ALL get the SAME piece
//     if (playersNeedingNewPieces.length > 0) {
//       this.logger.info(`🎯 ${playersNeedingNewPieces.length} players need new pieces: ${playersNeedingNewPieces.join(", ")}`);

//       // Get the CURRENT piece for ALL players
//       const currentPieceIndex = this.gameState.currentPieceIndex;
//       const nextPiece = this.gameState.sharedPieces[currentPieceIndex];

//       if (nextPiece) {
//         this.logger.info(`🔄 Giving piece index ${currentPieceIndex} (${nextPiece.type}) to ALL players`);

//         // Give SAME piece to ALL players who need it
//         playersNeedingNewPieces.forEach((playerName) => {
//           const gamer = this.gameState.gamers.find((g) => g.name === playerName);
//           if (gamer) {
//             gamer.currentPiece = {
//               type: nextPiece.type,
//               x: nextPiece.x,
//               y: nextPiece.y,
//               shape: nextPiece.shape,
//               rotation: nextPiece.rotation || 0,
//             };
//             this.logger.info(`✅ Gave ${nextPiece.type} to ${playerName}`);
//           }
//         });

//         // Advance index ONLY ONCE after all players get their pieces
//         this.gameState.currentPieceIndex++;
//         this.logger.info(`📈 Advanced global piece index to ${this.gameState.currentPieceIndex}`);
//       }
//     }

//     this.logger.info(`=== END UPDATE GAME TICK ===`);
//   }
// }

import MyWebSocket from "../socket/websocket";
import { GameState } from "../types/game";
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

    // Ensure shared pieces are initialized
    this.initializeSharedPieces();
  }

  private initializeSharedPieces() {
    if (!this.gameState.sharedPieces || this.gameState.sharedPieces.length === 0) {
      this.logger.info("Initializing shared pieces for synchronization");
      // Generate initial set of shared pieces
      this.gameState.sharedPieces = this.generatePieceSequence(100); // Generate 100 pieces ahead
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
        x: 4, // Start in middle of board
        y: 0, // Start at top
        shape: this.getPieceShape(type),
        rotation: 0,
      });
    }

    return pieces;
  }

  private getPieceShape(type: string) {
    const shapes = {
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

    // Ensure all players start with the same piece
    this.synchronizeInitialPieces();

    this.interval = setInterval(() => {
      this.updateGame();
      gameService.sendGameState(this.room);
    }, 1000);
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
        gamer.currentPieceIndex = 0; // All players start with piece 0
        this.logger.info(`✅ Gave initial ${initialPiece.type} (index 0) to ${gamer.name}`);
      }
    });

    // Next available piece will be index 1
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

      // Handle inputs with proper collision detection
      if (gamer.input.up && !gamer.input.upHasBeenCounted) {
        this.logger.info(`  🔄 Rotating ${gamer.name}'s piece`);
        const rotatedPiece = rotatePiece(gamer.currentPiece);
        if (isValidPosition(gamer.grid, rotatedPiece)) {
          gamer.currentPiece = rotatedPiece;
          hasMoved = true;
        }
        gamer.input.upHasBeenCounted = true;
      }

      if (gamer.input.left) {
        this.logger.info(`  🔹 Moving ${gamer.name} LEFT`);
        const testPiece = { ...gamer.currentPiece, x: gamer.currentPiece.x - 1 };
        if (isValidPosition(gamer.grid, testPiece)) {
          gamer.currentPiece.x -= 1;
          hasMoved = true;
        }
        gamer.input.left = false;
      }

      if (gamer.input.right) {
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
        const testPiece = { ...gamer.currentPiece, y: gamer.currentPiece.y + 1 };
        if (isValidPosition(gamer.grid, testPiece)) {
          gamer.currentPiece.y += 1;
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
        hasMoved = true;
      }

      // Auto-drop: Only if no manual input happened
      if (!hasMoved && canMoveDown(gamer.grid, gamer.currentPiece)) {
        this.logger.info(`  🔹 Auto-dropping ${gamer.name}'s piece`);
        gamer.currentPiece.y += 1;
      }

      // Check if piece has landed
      if (!canMoveDown(gamer.grid, gamer.currentPiece)) {
        this.logger.info(`  🎯 Piece landed for ${gamer.name} - merging into board`);

        // Merge piece into grid
        gamer.grid = mergePiece(gamer.grid, gamer.currentPiece);

        // Clear completed lines
        const { newBoard, linesCleared } = clearLines(gamer.grid);
        gamer.grid = newBoard;
        gamer.linesCleared += linesCleared;
        gamer.score += linesCleared * 100 + (linesCleared >= 4 ? 400 : 0);

        this.logger.info(`  📋 Merged piece into board, cleared ${linesCleared} lines`);

        // Clear current piece - they'll get new one in batch
        gamer.currentPiece = null;
        playersNeedingNewPieces.push(gamer.name);
      }

      this.logger.info(`  After: ${gamer.currentPiece?.type} at (${gamer.currentPiece?.x}, ${gamer.currentPiece?.y})`);
    });

    // Synchronized piece distribution
    this.distributeSynchronizedPieces(playersNeedingNewPieces);

    this.logger.info(`=== END UPDATE GAME TICK ===`);
  }
  private distributeSynchronizedPieces(playersNeedingNewPieces: string[]) {
    if (playersNeedingNewPieces.length === 0) {
      return;
    }

    this.logger.info(`🎯 ${playersNeedingNewPieces.length} players need new pieces: ${playersNeedingNewPieces.join(", ")}`);

    // Mark all these players as needing next piece
    playersNeedingNewPieces.forEach((playerName) => {
      const gamer = this.gameState.gamers.find((g) => g.name === playerName);
      if (gamer) {
        gamer.needsNextPiece = true;
        gamer.currentPiece = null;
      }
    });

    // Check if ALL players now need the next piece
    const allPlayersNeedNextPiece = this.gameState.gamers.every((g) => g.needsNextPiece || g.currentPiece === null);

    if (allPlayersNeedNextPiece) {
      this.logger.info(`🔄 ALL players need next piece - distributing synchronized pieces`);

      // Ensure we have enough pieces generated
      if (this.gameState.currentPieceIndex >= this.gameState.sharedPieces.length - 10) {
        this.logger.info("🔄 Generating more pieces for the sequence");
        const newPieces = this.generatePieceSequence(100);
        this.gameState.sharedPieces.push(...newPieces);
      }

      const currentPieceIndex = this.gameState.currentPieceIndex;
      const nextPiece = this.gameState.sharedPieces[currentPieceIndex];

      if (nextPiece) {
        this.logger.info(`🔄 Giving piece index ${currentPieceIndex} (${nextPiece.type}) to ALL players`);

        // Give SAME piece to ALL players
        this.gameState.gamers.forEach((gamer) => {
          gamer.currentPiece = {
            type: nextPiece.type,
            x: nextPiece.x,
            y: nextPiece.y,
            shape: [...nextPiece.shape.map((row) => [...row])],
            rotation: nextPiece.rotation || 0,
          };
          gamer.currentPieceIndex = currentPieceIndex;
          gamer.needsNextPiece = false;
          this.logger.info(`✅ Gave synchronized ${nextPiece.type} to ${gamer.name}`);
        });

        // Advance index ONLY ONCE after all players get their pieces
        this.gameState.currentPieceIndex++;
        this.logger.info(`📈 Advanced global piece index to ${this.gameState.currentPieceIndex}`);
      }
    } else {
      this.logger.info(`⏳ Not all players ready for next piece - waiting for synchronization`);
    }
  }

  // Helper method to determine what piece index a player should get next
  // private getPlayerNextPieceIndex(gamer: any): number {
  //   // If player doesn't have a tracked piece index, use the global one
  //   if (!gamer.hasOwnProperty("currentPieceIndex")) {
  //     gamer.currentPieceIndex = this.gameState.currentPieceIndex - 1; // -1 because we'll increment it below
  //   }

  //   // Give them the next piece in the sequence
  //   return gamer.currentPieceIndex + 1;
  // }

  // Method to manually force synchronization (useful for debugging)
  public forceSynchronization() {
    this.logger.info("🔄 Forcing piece synchronization for all players");

    const playersNeedingSync = this.gameState.gamers.map((g) => g.name);
    this.distributeSynchronizedPieces(playersNeedingSync);

    gameService.sendGameState(this.room);
  }

  // Method to get current synchronization status
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
