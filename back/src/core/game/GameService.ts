import MyWebSocket from "../socket/websocket";
import { TetrisGameLoop } from "../tetris/TetrisGameLoop";
import { Cell, GamerInputs, GameState, TetrisPiece, ClientGameState, ClientGamer } from "../types/game";
import { Player } from "../types/player";
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

  private generatePieces(count = 100): Array<{ type: string; x: number; y: number; shape: number[][]; rotation: number }> {
    const PIECES = [
      { shape: [[1, 1, 1, 1]], x: 3, y: 0, type: "I", color: 1, rotation: 0 }, // I - removed rotation
      {
        shape: [
          [1, 1],
          [1, 1],
        ],
        x: 4,
        y: 0,
        type: "O",
        color: 2,
        rotation: 0,
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
        rotation: 0,
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
        rotation: 0,
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
        rotation: 0,
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
        rotation: 0,
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
        rotation: 0,
      }, // L
    ];

    const pieces: Array<{ type: string; x: number; y: number; shape: number[][]; rotation: number }> = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * PIECES.length);
      const selectedPiece = PIECES[randomIndex];
      pieces.push({
        shape: selectedPiece.shape.map((row) => [...row]), // Deep copy
        x: selectedPiece.x,
        y: selectedPiece.y,
        type: selectedPiece.type,
        rotation: selectedPiece.rotation,
      });
    }

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
      rotation: piece.rotation,
    };
  }

  private ensurePiecesAvailable(room: string) {
    const gameState = this.games[room];
    if (!gameState) return;

    // Generate more pieces if running low
    const maxPlayerIndex = Math.max(...gameState.gamers.map((g) => g.currentPieceIndex ?? 0));
    if (maxPlayerIndex >= gameState.sharedPieces.length - 20) {
      this.logger.info(`Generating more pieces for room ${room}`);
      gameState.sharedPieces.push(...this.generatePieces(100));
    }
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
      sharedPieces: this.generatePieces(1000), // Generate plenty of pieces
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
        currentPieceIndex: 0,
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

  launchGame(room: string) {
    if (!this.games[room]) {
      this.logger.error(`can't launch game ${room}, game state not found`);
      return;
    }

    this.logger.info(`launching game ${room}`);

    const gameState = this.games[room];

    // Ensure we have a long piece sequence
    if (gameState.sharedPieces.length === 0) {
      gameState.sharedPieces = this.generatePieces(1000);
      this.logger.info(`Generated initial sequence of ${gameState.sharedPieces.length} pieces`);
    }

    // Give ALL players the SAME first piece (index 0)
    const firstPiece = gameState.sharedPieces[0];
    gameState.gamers.forEach((gamer) => {
      gamer.currentPiece = this.clonePiece(firstPiece);
      gamer.currentPieceIndex = 0; // Everyone starts at piece 0
      gamer.needsNextPiece = false;
      this.logger.info(`🎯 ${gamer.name}: Starting with piece #0 (${firstPiece.type})`);
    });

    gameState.isRunning = true;

    // Send initial state with piece sequence
    this.sendGameState(room);

    const tetrisLoop = new TetrisGameLoop(gameState, room);
    this.gameLoops[room] = tetrisLoop;
    tetrisLoop.start();
  }

  sendGameState(room: string) {
    const gameState = this.games[room];
    if (!gameState) return;

    const io = MyWebSocket.getInstance();

    // Create client game state
    const clientGameState: any = {
      room: gameState.room,
      currentPieceIndex: gameState.currentPieceIndex,
      pieceSequenceLength: gameState.sharedPieces.length,
      gamers: gameState.gamers.map((gamer) => {
        // Calculate next pieces for THIS specific player
        const playerNextPieceIndex = (gamer.currentPieceIndex ?? 0) + 1;
        const playerNextPieces = gameState.sharedPieces.slice(playerNextPieceIndex, playerNextPieceIndex + 5);

        return {
          name: gamer.name,
          grid: gamer.grid,
          currentPiece: gamer.currentPiece,
          currentPieceIndex: gamer.currentPieceIndex ?? 0,
          score: gamer.score,
          linesCleared: gamer.linesCleared,
          isReady: gamer.isReady,
          nextPieces: playerNextPieces, // Add next pieces per player
        };
      }),
      // Remove global nextPieces, now each player has their own
      isRunning: gameState.isRunning,
    };

    this.logger.info(`📤 Sending game state to room ${room}:`);
    gameState.gamers.forEach((gamer) => {
      const playerNextPieceIndex = (gamer.currentPieceIndex ?? 0) + 1;
      const nextPieces = gameState.sharedPieces.slice(playerNextPieceIndex, playerNextPieceIndex + 3);
      this.logger.info(
        `  ${gamer.name}: Current #${gamer.currentPieceIndex} (${gamer.currentPiece?.type}), Next: ${nextPieces.map((p) => p.type).join(", ")}`,
      );
    });

    io.to(room).emit("game:newState", clientGameState);
  }
  playerReady(playerName: string, room: string) {
    const gameState = this.games[room];
    if (!gameState) {
      this.logger.error(`Game ${room} not found`);
      return;
    }

    const gamerReady = gameState.gamers.find((elem) => elem.name === playerName);

    if (!gamerReady) {
      this.logger.warn(`couldn't find player ${playerName} in game ${room}`);
      throw new Error(`couldn't find player ${playerName} in game ${room}`);
    }

    gamerReady.isReady = true;
    this.logger.info(`Player ${playerName} is ready in room ${room}`);

    if (gameState.gamers.every((gamer) => gamer.isReady)) {
      this.logger.info(`every player in ${room} are ready, the game will launch`);
      const io = MyWebSocket.getInstance();
      io.to(room).emit("game:isLaunching");
      this.launchGame(room);
    }
  }

  playerInputChange(playerName: string, room: string, input: GamerInputs) {
    const gameState = this.games[room];
    if (!gameState) {
      this.logger.error(`Game ${room} not found`);
      return;
    }

    const gamer = gameState.gamers.find((elem) => elem.name === playerName);
    if (!gamer) {
      this.logger.warn(`couldn't find player ${playerName} in game ${room}`);
      return;
    }
    gamer.input = input;
  }

  // Updated method for individual piece advancement
  requestNextPiece(room: string, playerName: string) {
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

    // Ensure we have pieces available
    this.ensurePiecesAvailable(room);

    // Give player their NEXT piece from the sequence
    const nextPieceIndex = (gamer.currentPieceIndex ?? 0) + 1;
    const nextPiece = gameState.sharedPieces[nextPieceIndex];

    if (nextPiece) {
      gamer.currentPiece = this.clonePiece(nextPiece);
      gamer.currentPieceIndex = nextPieceIndex;
      gamer.needsNextPiece = false;

      this.logger.info(`✅ ${playerName}: Piece #${nextPieceIndex} (${nextPiece.type})`);

      // Send updated state
      this.sendGameState(room);
    } else {
      this.logger.error(`❌ No piece available at index ${nextPieceIndex} for ${playerName}`);
    }
  }

  getGameState(room: string): GameState | null {
    return this.games[room] || null;
  }

  stopGame(room: string) {
    if (this.gameLoops[room]) {
      this.gameLoops[room].stop();
      delete this.gameLoops[room];
      this.logger.info(`Stopped game loop for room ${room}`);
    }

    if (this.games[room]) {
      this.games[room].isRunning = false;
      delete this.games[room];
      this.logger.info(`Cleaned up game state for room ${room}`);
    }
  }

  getActiveGames(): string[] {
    return Object.keys(this.games);
  }

  gameExists(room: string): boolean {
    return !!this.games[room];
  }

  isGameRunning(room: string): boolean {
    const gameState = this.games[room];
    return gameState ? gameState.isRunning : false;
  }
}

export const gameService = new GameService();
