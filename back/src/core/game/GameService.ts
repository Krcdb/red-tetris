import MyWebSocket from "../socket/websocket";
import { TetrisGameLoop } from "../tetris/TetrisGameLoop";
import { GamerInputs } from "../types/game";
import { Player } from "../types/player";
import { getLogger } from "../utils/Logger";
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


  createGame(players: Player[], room: string) {
    console.log(`🎮 GameService: Creating game for room ${room} with ${players.length} player(s)`);

    const playerNames = players.map((p) => p.name);
    const game = new Game(room, playerNames);
    this.games[room] = game;

    const io = MyWebSocket.getInstance();

    io.to(room).emit("game:isSetup");
    console.log(`📤 GameService: Emitted game:isSetup for room ${room}`);

    // Optional: Also emit game state
    // io.to(room).emit("game:newState", game.getState());
    // console.log(`📤 GameService: Emitted initial game state for room ${room}`);
  }


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

    game.updatePlayerInput(playerName, input);
  }

  playerReady(playerName: string, room: string) {
    const game = this.games[room];
    if (!game) {
      this.logger.warn(`Game ${room} not found`);
      throw new Error(`Game ${room} not found`);
    }

    const allReady = game.setPlayerReady(playerName);

    if (allReady) {
      this.logger.info(`every player in ${room} are ready, the game will launch`);
      const io = MyWebSocket.getInstance();
      io.to(room).emit("game:isLaunching");
      this.launchGame(room);
    }
  }

  getGame(room: string): Game | null {
    return this.games[room] || null;
  }

  sendGameState(room: string) {
    const game = this.games[room];
    if (!game) return;

    const io = MyWebSocket.getInstance();
    const gameState = game.getGameState();

    // this.logger.info(`📤 Sending game state to room ${room}`);
    io.to(room).emit("game:newState", gameState);
  }

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
