// back/src/core/game/GameService.ts
import MyWebSocket from "../socket/websocket.js";
import { TetrisGameLoop } from "../tetris/TetrisGameLoop.js";
import { GamerInputs, InputDTO } from "../types/game.js";
import { Player } from "../types/player.js";
import { getLogger } from "../utils/Logger.js";
import { Game } from "../classes/Game.js";

type GameLoops = Record<string, TetrisGameLoop>;

class GameService {
  private gameLoops: GameLoops;
  private games: Record<string, Game>;
  private logger = getLogger("GameService");

  constructor() {
    this.games = {};
    this.gameLoops = {};
  }

  /** Create a fresh Game instance and notify the room that setup is done. */
  createGame(players: Player[], room: string) {
    this.logger.info(
      `Creating game for room ${room} with ${players.length} player(s)`,
    );

    const playerNames = players.map((p) => p.name);
    const game = new Game(room, playerNames);
    this.games[room] = game;

    MyWebSocket.getInstance().to(room).emit("game:isSetup");
  }

  /** Start the Tetris game loop once all pre-checks pass. */
  launchGame(room: string) {
    const game = this.games[room];
    if (!game) {
      this.logger.error(`Can't launch game ${room}: not found`);
      return;
    }
    if (game.isRunning) {
      this.logger.warn(`Game ${room} already running`);
      return;
    }
    if (this.gameLoops[room]) {
      this.logger.warn(`Game loop for room ${room} already exists`);
      return;
    }

    this.logger.info(`Launching game ${room}`);
    game.start();

    const loop = new TetrisGameLoop(game.getGameState(), room);
    this.gameLoops[room] = loop;
    loop.start();
  }

  /** Called whenever a player presses or releases a control key. */
  playerInputChange(playerName: string, room: string, input: InputDTO) {
    const game = this.games[room];
    if (!game) {
      this.logger.warn(`Game ${room} not found`);
      return;
    }
    game.updatePlayerInput(playerName, input);
  }

  /** Mark a player as ready; when everyone’s ready, begin the match. */
  playerReady(playerName: string, room: string) {
    const game = this.games[room];
    if (!game) {
      this.logger.warn(`Game ${room} not found`);
      throw new Error(`Game ${room} not found`);
    }

    const allReady = game.setPlayerReady(playerName);
    if (allReady) {
      this.logger.info(`All players in ${room} are ready; launching`);
      MyWebSocket.getInstance().to(room).emit("game:isLaunching");
      this.launchGame(room);
    }
  }

  /** Utility helpers — useful all over the backend */
  getGame(room: string): Game | null {
    return this.games[room] ?? null;
  }

  sendGameState(room: string) {
    const game = this.games[room];
    if (!game) return;
    MyWebSocket.getInstance()
      .to(room)
      .emit("game:newState", game.getGameState());
  }

  forceStopGame(room: string) {
    this.logger.info(`Force-stopping game in room ${room}`);

    const loop = this.gameLoops[room];
    if (loop) {
      loop.stop();
      delete this.gameLoops[room];
    }

    const game = this.games[room];
    if (game) {
      game.stop();
      delete this.games[room];
    }
  }

  gameExists(room: string): boolean {
    return room in this.games;
  }

  isGameRunning(room: string): boolean {
    return this.games[room]?.isRunning ?? false;
  }

  getActiveGames(): string[] {
    return Object.keys(this.games);
  }
}

export const gameService = new GameService();
