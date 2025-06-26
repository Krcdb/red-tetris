import MyWebSocket from "../socket/websocket";
import { TetrisGameLoop } from "../tetris/TetrisGameLoop";
import { Cell, GamerInputs, GameState, TetrisPiece, ClientGameState, ClientGamer } from "../types/game";
import { Player } from "../types/player";
import { CustomeSocket } from "../types/socket-event";
import { getLogger } from "../utils/Logger";

type GameStates = { [key: string]: GameState };
type GameLoops = { [key: string]: TetrisGameLoop };

class GameService {
  private games: GameStates;
  private gameLoops: GameLoops;
  private logger = getLogger("GameService");

  constructor() {
    this.games = {};
    this.gameLoops = {};
  }

  // =====================================
  // PRIVATE METHODS - Internal Logic
  // =====================================

  private initializeGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let i = 0; i < 20; i++) {
      grid.push(new Array(10).fill(0));
    }
    return grid;
  }

  private generatePieces(count = 100): TetrisPiece[] {
    const PIECES = [
      { shape: [[1, 1, 1, 1]], x: 3, y: 0, type: "I", color: 1 }, // I
      {
        shape: [
          [1, 1],
          [1, 1],
        ],
        x: 4,
        y: 0,
        type: "O",
        color: 2,
      }, // O
      {
        shape: [
          [0, 1, 0],
          [1, 1, 1],
        ],
        x: 3,
        y: 0,
        type: "T",
        color: 3,
      }, // T
      {
        shape: [
          [0, 1, 1],
          [1, 1, 0],
        ],
        x: 3,
        y: 0,
        type: "S",
        color: 4,
      }, // S
      {
        shape: [
          [1, 1, 0],
          [0, 1, 1],
        ],
        x: 3,
        y: 0,
        type: "Z",
        color: 5,
      }, // Z
      {
        shape: [
          [1, 0, 0],
          [1, 1, 1],
        ],
        x: 3,
        y: 0,
        type: "J",
        color: 6,
      }, // J
      {
        shape: [
          [0, 0, 1],
          [1, 1, 1],
        ],
        x: 3,
        y: 0,
        type: "L",
        color: 7,
      }, // L
    ];

    const pieces: TetrisPiece[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * PIECES.length);
      const selectedPiece = PIECES[randomIndex];
      pieces.push({
        shape: selectedPiece.shape.map((row) => [...row]), // Deep copy
        x: selectedPiece.x,
        y: selectedPiece.y,
        type: selectedPiece.type,
        color: selectedPiece.color,
      });
    }

    // This log will show in your backend console/terminal
    this.logger.info(
      `Generated ${count} pieces. First 5 types: ${pieces
        .slice(0, 5)
        .map((p) => p.type)
        .join(", ")}`,
    );
    return pieces;
  }

  private clonePiece(piece: TetrisPiece): TetrisPiece {
    return {
      shape: piece.shape.map((row) => [...row]),
      x: piece.x,
      y: piece.y,
      type: piece.type,
      color: piece.color,
    };
  }

  private ensurePiecesAvailable(room: string) {
    const gameState = this.games[room];
    if (!gameState) return;

    // Generate more pieces if running low
    if (gameState.currentPieceIndex >= gameState.sharedPieces.length - 20) {
      this.logger.info(`Generating more pieces for room ${room}`);
      gameState.sharedPieces.push(...this.generatePieces(100));
    }
  }

  private giveNextPiece(room: string, playerName: string): TetrisPiece | null {
    const gameState = this.games[room];
    if (!gameState) return null;

    const player = gameState.gamers.find((g) => g.name === playerName);
    if (!player) return null;

    // Ensure we have pieces available
    this.ensurePiecesAvailable(room);

    // Get next piece from shared sequence
    const nextPiece = gameState.sharedPieces[gameState.currentPieceIndex];
    if (!nextPiece) return null;

    // Give player a copy of the next piece
    player.currentPiece = this.clonePiece(nextPiece);

    // Advance piece index for this room
    gameState.currentPieceIndex++;

    this.logger.info(`Gave piece to ${playerName}: ${nextPiece.type || "unknown"}`);
    return player.currentPiece;
  }

  // =====================================
  // PUBLIC METHODS - External Interface
  // =====================================

  createGame(players: Player[], room: string) {
    this.logger.info(`Creating game for room ${room} with ${players.length} player(s)`);

    this.games[room] = {
      room: room,
      isSolo: players.length === 1,
      isRunning: false,
      gamers: [],
      sharedPieces: this.generatePieces(200), // Generate plenty of pieces
      currentPieceIndex: 0,
    };

    players.forEach((player) =>
      this.games[room].gamers.push({
        isReady: false,
        name: player.name,
        input: {
          up: false,
          left: false,
          right: false,
          down: false,
          space: false,
          spaceHasBeenCounted: false,
          upHasBeenCounted: false,
        },
        grid: this.initializeGrid(),
        currentPiece: null,
        score: 0,
        linesCleared: 0,
        needsNextPiece: false,
      }),
    );

    const io = MyWebSocket.getInstance();
    io.to(room).emit("game:isSetup");
  }

  forceStopGame(room: string) {
    this.logger.info(`🛑 Force stopping game in room ${room}`);

    // Stop the game loop
    const gameLoop = this.gameLoops[room];
    if (gameLoop) {
      gameLoop.stop();
      delete this.gameLoops[room];
      this.logger.info(`✅ Game loop for room ${room} stopped`);
    } else {
      this.logger.info(`ℹ️  No game loop found for room ${room}`);
    }

    // Remove game state
    if (this.games[room]) {
      delete this.games[room];
      this.logger.info(`✅ Game state for room ${room} deleted`);
    } else {
      this.logger.info(`ℹ️  No game state found for room ${room}`);
    }
  }

  // launchGame(room: string) {
  //   if (!this.games[room]) {
  //     this.logger.error(`can't launch game ${room}, game state not found`);
  //     return;
  //   }

  //   this.logger.info(`launching game ${room}`);

  //   const gameState = this.games[room];

  //   // Log the first 10 pieces for debugging
  //   this.logger.info(`=== PIECE SEQUENCE FOR ROOM ${room} ===`);
  //   gameState.sharedPieces.slice(0, 10).forEach((piece, index) => {
  //     this.logger.info(`Piece ${index}: ${piece.type} at (${piece.x}, ${piece.y})`);
  //   });
  //   this.logger.info(`=== END PIECE SEQUENCE ===`);

  //   // Give each player their first piece from shared sequence
  //   const firstPiece = gameState.sharedPieces[0];
  //   if (!firstPiece) {
  //     this.logger.error(`No first piece available for room ${room}`);
  //     return;
  //   }

  //   gameState.gamers.forEach((gamer) => {
  //     gamer.currentPiece = this.clonePiece(firstPiece);
  //     this.logger.info(`=== PLAYER ${gamer.name} INITIAL PIECE ===`);
  //     this.logger.info(`Type: ${gamer.currentPiece?.type}`);
  //     this.logger.info(`Position: (${gamer.currentPiece?.x}, ${gamer.currentPiece?.y})`);
  //     this.logger.info(`Shape: ${JSON.stringify(gamer.currentPiece?.shape)}`);
  //   });

  //   gameState.currentPieceIndex = 1;
  //   gameState.isRunning = true;

  //   // Send initial state
  //   this.sendGameState(room);

  //   const tetrisLoop = new TetrisGameLoop(gameState, room);
  //   this.gameLoops[room] = tetrisLoop;
  //   tetrisLoop.start();
  // }

  // sendGameState(room: string) {
  //   const gameState = this.games[room];
  //   if (!gameState) {
  //     this.logger.warn(`Cannot send game state for non-existent room ${room}`);
  //     return;
  //   }

  //   const io = MyWebSocket.getInstance();

  //   const clientGameState: ClientGameState = {
  //     room: room,
  //     currentPieceIndex: gameState.currentPieceIndex,
  //     nextPieces: gameState.sharedPieces.slice(gameState.currentPieceIndex, gameState.currentPieceIndex + 5),
  //     gamers: gameState.gamers.map(
  //       (gamer): ClientGamer => ({
  //         name: gamer.name,
  //         grid: gamer.grid,
  //         currentPiece: gamer.currentPiece,
  //         score: gamer.score,
  //         linesCleared: gamer.linesCleared,
  //         isReady: gamer.isReady,
  //       }),
  //     ),
  //   };

  //   // Log what we're sending to each player
  //   this.logger.info(`=== SENDING TO ROOM ${room} ===`);
  //   clientGameState.gamers.forEach((gamer) => {
  //     this.logger.info(`Player ${gamer.name}:`);
  //     this.logger.info(`  Current Piece: ${gamer.currentPiece?.type} at (${gamer.currentPiece?.x}, ${gamer.currentPiece?.y})`);
  //     this.logger.info(`  Score: ${gamer.score}, Lines: ${gamer.linesCleared}`);
  //   });
  //   this.logger.info(`Next Pieces: ${clientGameState.nextPieces.map((p) => p.type).join(", ")}`);

  //   io.to(room).emit("game:newState", clientGameState);
  // }

  launchGame(room: string) {
    if (!this.games[room]) {
      this.logger.error(`can't launch game ${room}, game state not found`);
      return;
    }

    this.logger.info(`launching game ${room}`);

    const gameState = this.games[room];

    // Log the first 10 pieces for debugging
    this.logger.info(`=== PIECE SEQUENCE FOR ROOM ${room} ===`);
    gameState.sharedPieces.slice(0, 10).forEach((piece, index) => {
      this.logger.info(`Piece ${index}: ${piece.type} at (${piece.x}, ${piece.y})`);
    });
    this.logger.info(`=== END PIECE SEQUENCE ===`);

    // Give ALL players the SAME first piece from shared sequence
    if (gameState.sharedPieces.length === 0) {
      this.logger.error(`No pieces available for room ${room}`);
      return;
    }

    const firstPiece = gameState.sharedPieces[0];
    gameState.gamers.forEach((gamer) => {
      // Each player gets their own copy but from the same template
      gamer.currentPiece = this.clonePiece(firstPiece);
      this.logger.info(`=== PLAYER ${gamer.name} INITIAL PIECE ===`);
      this.logger.info(`Type: ${gamer.currentPiece?.type}`);
      this.logger.info(`Position: (${gamer.currentPiece?.x}, ${gamer.currentPiece?.y})`);
      this.logger.info(`Shape: ${JSON.stringify(gamer.currentPiece?.shape)}`);
    });

    // All players use the same piece sequence
    gameState.currentPieceIndex = 1;
    gameState.isRunning = true;

    // Send initial state
    this.sendGameState(room);

    const tetrisLoop = new TetrisGameLoop(gameState, room);
    this.gameLoops[room] = tetrisLoop;
    tetrisLoop.start();
  }

  sendGameState(room: string) {
    const gameState = this.games[room];
    if (!gameState) {
      this.logger.warn(`Cannot send game state for non-existent room ${room}`);
      return;
    }

    // // ENSURE ALL PLAYERS HAVE PIECES BEFORE SENDING STATE
    // gameState.gamers.forEach((gamer) => {
    //   if (!gamer.currentPiece) {
    //     this.logger.info(`Giving piece to ${gamer.name} who has no current piece`);
    //     this.giveNextPiece(room, gamer.name);
    //   }
    // });

    const io = MyWebSocket.getInstance();

    const clientGameState: ClientGameState = {
      room: room,
      currentPieceIndex: gameState.currentPieceIndex,
      nextPieces: gameState.sharedPieces.slice(gameState.currentPieceIndex, gameState.currentPieceIndex + 5),
      gamers: gameState.gamers.map(
        (gamer): ClientGamer => ({
          name: gamer.name,
          grid: gamer.grid,
          currentPiece: gamer.currentPiece,
          score: gamer.score,
          linesCleared: gamer.linesCleared,
          isReady: gamer.isReady,
        }),
      ),
    };

    // Log what we're sending to each player
    this.logger.info(`=== SENDING TO ROOM ${room} ===`);
    clientGameState.gamers.forEach((gamer) => {
      this.logger.info(`Player ${gamer.name}:`);
      this.logger.info(`  Current Piece: ${gamer.currentPiece?.type} at (${gamer.currentPiece?.x}, ${gamer.currentPiece?.y})`);
      this.logger.info(`  Score: ${gamer.score}, Lines: ${gamer.linesCleared}`);
    });
    this.logger.info(`Next Pieces: ${clientGameState.nextPieces.map((p) => p.type).join(", ")}`);

    io.to(room).emit("game:newState", clientGameState);
  }

  playerReady(playerName: string, room: string) {
    const gamerReady = this.games[room].gamers.find((elem) => elem.name === playerName);

    if (!gamerReady) {
      this.logger.warn(`couldn't find player ${playerName} in game ${room}`);
      throw new Error(`couldn't find player ${playerName} in game ${room}`);
    }

    gamerReady.isReady = true;
    this.logger.info(`Player ${playerName} is ready in room ${room}`);

    if (this.games[room].gamers.every((gamer) => gamer.isReady)) {
      this.logger.info(`every player in ${room} are ready, the game will launch`);
      const io = MyWebSocket.getInstance();
      io.to(room).emit("game:isLaunching");
      this.launchGame(room);
    }
  }

  playerInputChange(playerName: string, room: string, input: GamerInputs) {
    const gamer = this.games[room].gamers.find((elem) => elem.name === playerName);
    if (!gamer) {
      this.logger.warn(`couldn't find player ${playerName} in game ${room}`);
      throw new Error(`couldn't find player ${playerName} in game ${room}`);
    }
    gamer.input = input;
  }

  // NEW: Handle piece landing from client - SERVER AUTHORITATIVE
  handlePieceLanded(room: string, playerName: string, finalPosition: TetrisPiece, clearedLines: number = 0) {
    this.logger.info(`Server handling piece landing for ${playerName} in room ${room}`);

    const gameState = this.games[room];
    if (!gameState) {
      this.logger.warn(`Room ${room} not found when handling piece landed`);
      return;
    }

    const player = gameState.gamers.find((g) => g.name === playerName);
    if (!player) {
      this.logger.warn(`Player ${playerName} not found in room ${room}`);
      return;
    }

    // Server updates player state authoritatively
    player.linesCleared += clearedLines;
    player.score += clearedLines * 100 + (clearedLines >= 4 ? 400 : 0);

    // Give player next piece from shared sequence
    this.giveNextPiece(room, playerName);

    // Broadcast updated state to all players
    this.sendGameState(room);
  }

  // Add this method to replace the current getNextPiece logic

  getNextPiece(room: string, playerName: string) {
    const gameState = this.games[room];
    if (!gameState) {
      this.logger.error(`Game ${room} not found`);
      return;
    }

    const gamer = gameState.gamers.find((g) => g.name === playerName);
    if (!gamer) {
      this.logger.error(`Player ${playerName} not found in room ${room}`);
      return;
    }

    // Mark this player as needing the next piece
    gamer.needsNextPiece = true;
    gamer.currentPiece = null;

    this.logger.info(`Player ${playerName} marked as needing next piece`);

    // Check if ALL players need the next piece
    const allPlayersNeedNextPiece = gameState.gamers.every((g) => g.needsNextPiece || g.currentPiece === null);

    if (allPlayersNeedNextPiece) {
      this.logger.info(`🔄 ALL players need next piece - advancing to synchronized piece distribution`);
      this.advanceAllPlayersToNextPiece(room);
    } else {
      this.logger.info(`⏳ Waiting for other players to finish their pieces before advancing`);

      // Send current state so the waiting player sees their piece disappeared
      this.sendGameState(room);
    }
  }

  private advanceAllPlayersToNextPiece(room: string) {
    const gameState = this.games[room];
    if (!gameState) return;

    // Ensure we have enough pieces
    this.ensurePiecesAvailable(room);

    if (gameState.currentPieceIndex < gameState.sharedPieces.length) {
      const nextPiece = gameState.sharedPieces[gameState.currentPieceIndex];

      this.logger.info(`🎯 Giving synchronized piece ${gameState.currentPieceIndex}: ${nextPiece.type} to ALL players`);

      // Give the SAME piece to ALL players
      gameState.gamers.forEach((gamer) => {
        gamer.currentPiece = this.clonePiece(nextPiece);
        gamer.needsNextPiece = false;
        this.logger.info(`✅ Gave synchronized ${nextPiece.type} to ${gamer.name}`);
      });

      // Advance the piece index for the entire game
      gameState.currentPieceIndex++;
      this.logger.info(`📈 Advanced global piece index to ${gameState.currentPieceIndex}`);

      // Send updated state to all players
      this.sendGameState(room);
    } else {
      this.logger.error(`No more pieces available in shared sequence`);
    }
  }

  giveNextPieceWithoutAdvancing(room: string, playerName: string) {
    const gameState = this.games[room];
    if (!gameState) return;

    const gamer = gameState.gamers.find((g) => g.name === playerName);
    if (!gamer) return;

    // Ensure we have pieces available
    this.ensurePiecesAvailable(room);

    // Give piece from current index WITHOUT advancing
    if (gameState.currentPieceIndex < gameState.sharedPieces.length) {
      const nextPiece = gameState.sharedPieces[gameState.currentPieceIndex];
      gamer.currentPiece = this.clonePiece(nextPiece);
      gamer.needsNextPiece = false;

      this.logger.info(`Gave piece to ${playerName}: ${nextPiece.type} (index ${gameState.currentPieceIndex})`);
    }
  }

  advancePieceIndex(room: string) {
    const gameState = this.games[room];
    if (gameState) {
      gameState.currentPieceIndex++;
      this.logger.info(`🔄 Advanced piece index to ${gameState.currentPieceIndex}`);
    }
  }

  getGameState(room: string): GameState | null {
    return this.games[room] || null;
  }

  // NEW: Stop and cleanup a game
  stopGame(room: string) {
    // Stop game loop if running
    if (this.gameLoops[room]) {
      this.gameLoops[room].stop();
      delete this.gameLoops[room];
      this.logger.info(`Stopped game loop for room ${room}`);
    }

    // Clean up game state
    if (this.games[room]) {
      this.games[room].isRunning = false;
      delete this.games[room];
      this.logger.info(`Cleaned up game state for room ${room}`);
    }
  }

  // NEW: Get active games (for debugging)
  getActiveGames(): string[] {
    return Object.keys(this.games);
  }

  // NEW: Check if game exists
  gameExists(room: string): boolean {
    return !!this.games[room];
  }

  // NEW: Check if game is running
  isGameRunning(room: string): boolean {
    const gameState = this.games[room];
    return gameState ? gameState.isRunning : false;
  }
}

export const gameService = new GameService();
