import MyWebSocket from "../socket/websocket";
import { TetrisGameLoop } from "../tetris/TetrisGameLoop";
import { Cell, GamerInputs, GameState } from "../types/game";
import { Player } from "../types/player";
import { CustomeSocket } from "../types/socket-event";
import { getLogger } from "../utils/Logger";

type GameLoops = Record<string, TetrisGameLoop>;
type GameStates = Record<string, GameState>;

class GameService {
  private gameLoops: GameLoops;
  private games: GameStates;

  private logger = getLogger("GameService");

  constructor() {
    this.games = {};
    this.gameLoops = {};
  }

  createGame(players: Player[], room: string) {
    this.logger.info(`Creating game for room ${room}`);

    this.games[room] = {
      gamers: [],
      isRunning: false,
      isSolo: true,
      room: "",
    };

    if (players.length > 1) {
      this.games[room].isSolo = false;
    }

    players.forEach((player) =>
      this.games[room].gamers.push({
        grid: this.initializeGrid(),
        input: {
          down: false,
          left: false,
          right: false,
          space: false,
          spaceHasBeenCounted: false,
          up: false,
          upHasBeenCounted: false,
        },
        isReady: false,
        name: player.name,
      }),
    );

    const io = MyWebSocket.getInstance();
    io.to(room).emit("game:isSetup");
  }

  launchGame(room: string) {
    if (!this.games[room]) {
      this.logger.error(`can't launch game ${room}, game state not found`);
      return;
    }

    this.logger.info(`launching game ${room}`);

    const tetrisLoop = new TetrisGameLoop(this.games[room], room);
    this.gameLoops[room] = tetrisLoop;
    tetrisLoop.start();
  }

  playerInputChange(playerName: string, room: string, input: GamerInputs) {
    const gamer = this.games[room].gamers.find((elem) => elem.name === playerName);
    if (!gamer) {
      this.logger.warn(`couldn't find player ${playerName} in game ${room}`);
      throw new Error(`couldn't find player ${playerName} in game ${room}`);
    }
    gamer.input = input;
  }

  playerReady(playerName: string, room: string) {
    const gamerReady = this.games[room].gamers.find((elem) => elem.name === playerName);

    if (!gamerReady) {
      this.logger.warn(`couldn't find player ${playerName} in game ${room}`);
      throw new Error(`couldn't find player ${playerName} in game ${room}`);
    }
    gamerReady.isReady = true;

    if (this.games[room].gamers.every((gamer) => gamer.isReady)) {
      this.logger.info(`every player in ${room} are ready, the game will launch`);
      const io = MyWebSocket.getInstance();
      io.to(room).emit("game:isLaunching");
      this.launchGame(room);
    }
  }

  private initializeGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let i = 0; i < 20; i++) {
      grid.push(new Array(10).fill(0));
    }
    return grid;
  }
}

export const gameService = new GameService();
