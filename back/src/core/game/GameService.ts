import MyWebSocket from "../socket/websocket";
import { Cell, GamerInputs, GameState } from "../types/game";
import { Player } from "../types/player";
import { CustomeSocket } from "../types/socket-event";
import { getLogger } from "../utils/Logger";

type GameStates = {[key:string]: GameState}

class GameService {
  games: GameStates;

  private logger = getLogger("GameService")

  constructor() {
    this.games = {}
  }

  private initializeGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let i = 0; i < 20; i++) {
      grid.push(new Array(10).fill(0));
    }
    return grid;
  }

  createGame(players: Player[], room: string) {
    this.logger.info(`Creating game for room ${room}`);

    this.games[room] = {
      room: "",
      isSolo: true,
      isRunning: false,
      gamers: [],
    }

    if (players.length > 1) {
      this.games[room].isSolo = false
    }

    players.forEach((player) => this.games[room].gamers.push({
      isReady: false,
      name: player.name,
      input: {
          up: false,
          left: false,
          right: false,
          down: false,
          space: false,
          spaceHasBeenCounted: false,
          upHasBeenCounted:false,
        },
      grid: this.initializeGrid(),
    }));

    const io = MyWebSocket.getInstance();
    io.to(room).emit("game:isSetup");
  }

  launchGame(room: string) {
    //how can i handle all game that will be launch here
  }

  playerReady(playerName: string, room: string) {
    const gamerReady = this.games[room].gamers.find((elem) => elem.name === playerName);
    if (!gamerReady) {
      this.logger.warn(`couldn't find player ${playerName} in game ${room}`);
      throw new Error(`couldn't find player ${playerName} in game ${room}`);
    }
    gamerReady.isReady = true;
    const newGamerReady = this.games[room].gamers.find((elem) => elem.name === playerName);
    this.logger.info(`test if gamer ready ${newGamerReady?.isReady}`);

    if (this.games[room].gamers.every(gamer => gamer.isReady)) {
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
    const newGamer = this.games[room].gamers.find((elem) => elem.name === playerName);
    this.logger.info(`test if gamer ready ${JSON.stringify(newGamer?.input)}`)
  }
}

export const gameService = new GameService();
