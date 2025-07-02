// import MyWebSocket from "../socket/websocket";
// import { TetrisGameLoop } from "../tetris/TetrisGameLoop";
// import { Cell, GamerInputs, GameState, TetrisPiece, ClientGameState, ClientGamer } from "../types/game";
// import { Player } from "../types/player";
// import { getLogger } from "../utils/Logger";
// import { Game } from "../classes/Game.js";
// import { Player as PlayerClass } from "../classes/Player.js";
// import { Piece } from "../classes/Piece.js";

// type GameLoops = { [key: string]: TetrisGameLoop };

// class GameService {
//   private games: { [key: string]: Game };
//   private gameLoops: GameLoops;
//   private logger = getLogger("GameService");

//   constructor() {
//     this.games = {};
//     this.gameLoops = {};
//   }

//   createGame(players: Player[], room: string) {
//     this.logger.info(`Creating game for room ${room} with ${players.length} player(s)`);

//     const playerNames = players.map((p) => p.name);
//     this.games[room] = new Game(room, playerNames);

//     const io = MyWebSocket.getInstance();
//     io.to(room).emit("game:isSetup");
//   }

//   playerReady(playerName: string, room: string) {
//     const game = this.games[room];
//     if (!game) {
//       this.logger.error(`Game ${room} not found`);
//       return;
//     }

//     const allReady = game.setPlayerReady(playerName);

//     if (allReady) {
//       this.logger.info(`All players ready in ${room}, launching game`);
//       const io = MyWebSocket.getInstance();
//       io.to(room).emit("game:isLaunching");
//       this.launchGame(room);
//     }
//   }

//   launchGame(room: string) {
//     const game = this.games[room];
//     if (!game) {
//       this.logger.error(`Can't launch game ${room}, game not found`);
//       return;
//     }

//     game.start();
//     this.sendGameState(room);

//     const tetrisLoop = new TetrisGameLoop(game, room);
//     this.gameLoops[room] = tetrisLoop;
//     tetrisLoop.start();
//   }

//   getGame(room: string): Game | null {
//     return this.games[room] || null;
//   }

//   sendGameState(room: string) {
//     const game = this.games[room];
//     if (!game) return;

//     const io = MyWebSocket.getInstance();

//     const gameState = game.getGameState();

//     const clientGameState: any = {
//       room: gameState.room,
//       currentPieceIndex: gameState.currentPieceIndex,
//       pieceSequenceLength: gameState.pieceSequenceLength,
//       gamers: gameState.gamers,
//       isRunning: gameState.isRunning,
//     };

//     this.logger.info(`📤 Sending game state to room ${room}`);
//     io.to(room).emit("game:newState", clientGameState);
//   }

//   playerInputChange(playerName: string, room: string, input: GamerInputs) {
//     const game = this.games[room];
//     if (!game) {
//       this.logger.error(`Game ${room} not found`);
//       return;
//     }

//     game.updatePlayerInput(playerName, input);
//   }

//   forceStopGame(room: string) {
//     this.logger.info(`🛑 Force stopping game in room ${room}`);

//     const gameLoop = this.gameLoops[room];
//     if (gameLoop) {
//       gameLoop.stop();
//       delete this.gameLoops[room];
//       this.logger.info(`✅ Game loop for room ${room} stopped`);
//     }

//     const game = this.games[room];
//     if (game) {
//       game.stop();
//       delete this.games[room];
//       this.logger.info(`✅ Game state for room ${room} deleted`);
//     }
//   }

//   getGameState(room: string): any {
//     const game = this.games[room];
//     return game ? game.getGameState() : null;
//   }

//   stopGame(room: string) {
//     if (this.gameLoops[room]) {
//       this.gameLoops[room].stop();
//       delete this.gameLoops[room];
//       this.logger.info(`Stopped game loop for room ${room}`);
//     }

//     if (this.games[room]) {
//       this.games[room].stop();
//       delete this.games[room];
//       this.logger.info(`Cleaned up game state for room ${room}`);
//     }
//   }

//   getActiveGames(): string[] {
//     return Object.keys(this.games);
//   }

//   gameExists(room: string): boolean {
//     return !!this.games[room];
//   }

//   isGameRunning(room: string): boolean {
//     const game = this.games[room];
//     return game ? game.isRunning : false;
//   }
// }

// export const gameService = new GameService();

import MyWebSocket from "../socket/websocket";
import { TetrisGameLoop } from "../tetris/TetrisGameLoop";
import { GamerInputs } from "../types/game";
import { Player } from "../types/player";
import { getLogger } from "../utils/Logger";
// Import the new Game class
import { Game } from "../classes/Game.js";

type GameLoops = Record<string, TetrisGameLoop>;

class GameService {
  private gameLoops: GameLoops;
  private games: Record<string, Game>; // Use Game class instead of GameStates

  private logger = getLogger("GameService");

  constructor() {
    this.games = {};
    this.gameLoops = {};
  }

  // createGame(players: Player[], room: string) {
  //   this.logger.info(`Creating game for room ${room} with ${players.length} player(s)`);

  //   // Use the new Game class
  //   const playerNames = players.map((p) => p.name);
  //   this.games[room] = new Game(room, playerNames);

  //   const io = MyWebSocket.getInstance();
  //   io.to(room).emit("game:isSetup");
  // }

  createGame(players: Player[], room: string) {
    console.log(`🎮 GameService: Creating game for room ${room} with ${players.length} player(s)`);

    // Create the game
    const playerNames = players.map((p) => p.name);
    const game = new Game(room, playerNames);
    this.games[room] = game;

    // ✅ ADD THESE MISSING EVENTS
    const io = MyWebSocket.getInstance();

    // Emit game setup event to all players in the room
    io.to(room).emit("game:isSetup");
    console.log(`📤 GameService: Emitted game:isSetup for room ${room}`);

    // Optional: Also emit game state
    // io.to(room).emit("game:newState", game.getState());
    // console.log(`📤 GameService: Emitted initial game state for room ${room}`);
  }

  // launchGame(room: string) {
  //   const game = this.games[room];
  //   if (!game) {
  //     this.logger.error(`can't launch game ${room}, game not found`);
  //     return;
  //   }

  //   this.logger.info(`launching game ${room}`);

  //   // Start the game using the Game class method
  //   game.start();

  //   // Pass the game state to TetrisGameLoop
  //   const tetrisLoop = new TetrisGameLoop(game.getGameState(), room);
  //   this.gameLoops[room] = tetrisLoop;
  //   tetrisLoop.start();
  // }

  launchGame(room: string) {
    const game = this.games[room];
    if (!game) {
      this.logger.error(`can't launch game ${room}, game not found`);
      return;
    }

    if (game.isRunning) {
      this.logger.warn(`Game ${room} is already running, not launching again`);
      return;
    }

    if (this.gameLoops[room]) {
      this.logger.warn(`Game loop for room ${room} already exists, not starting another`);
      return;
    }

    this.logger.info(`launching game ${room}`);

    game.start();

    const tetrisLoop = new TetrisGameLoop(game.getGameState(), room);
    this.gameLoops[room] = tetrisLoop;
    tetrisLoop.start();
  }

  playerInputChange(playerName: string, room: string, input: GamerInputs) {
    const game = this.games[room];
    if (!game) {
      this.logger.warn(`Game ${room} not found`);
      return;
    }

    // Use the Game class method
    game.updatePlayerInput(playerName, input);
  }

  playerReady(playerName: string, room: string) {
    const game = this.games[room];
    if (!game) {
      this.logger.warn(`Game ${room} not found`);
      throw new Error(`Game ${room} not found`);
    }

    // Use the Game class method
    const allReady = game.setPlayerReady(playerName);

    if (allReady) {
      this.logger.info(`every player in ${room} are ready, the game will launch`);
      const io = MyWebSocket.getInstance();
      io.to(room).emit("game:isLaunching");
      this.launchGame(room);
    }
  }

  // Add method to get game instance (needed for TetrisGameLoop)
  getGame(room: string): Game | null {
    return this.games[room] || null;
  }

  // Add method to send game state
  sendGameState(room: string) {
    const game = this.games[room];
    if (!game) return;

    const io = MyWebSocket.getInstance();
    const gameState = game.getGameState();

    // this.logger.info(`📤 Sending game state to room ${room}`);
    io.to(room).emit("game:newState", gameState);
  }

  // Add method to force stop game
  forceStopGame(room: string) {
    this.logger.info(`🛑 Force stopping game in room ${room}`);

    const gameLoop = this.gameLoops[room];
    if (gameLoop) {
      gameLoop.stop();
      delete this.gameLoops[room];
      this.logger.info(`✅ Game loop for room ${room} stopped`);
    }

    const game = this.games[room];
    if (game) {
      game.stop();
      delete this.games[room];
      this.logger.info(`✅ Game state for room ${room} deleted`);
    }
  }

  // Add other utility methods
  gameExists(room: string): boolean {
    return !!this.games[room];
  }

  isGameRunning(room: string): boolean {
    const game = this.games[room];
    return game ? game.isRunning : false;
  }

  getActiveGames(): string[] {
    return Object.keys(this.games);
  }
}

export const gameService = new GameService();
