import MyWebSocket from "../socket/websocket";
import { GameState } from "../types/game";
import { getLogger } from "../utils/Logger";

export class TetrisGameLoop {
  private gameState: GameState;
  private interval: NodeJS.Timeout | null = null;
  private io: MyWebSocket;
  private logger = getLogger("TetrisGameLoop");
  private room: string;

  constructor(initialState: GameState, room: string) {
    this.gameState = initialState;
    this.room = room;
    this.io = MyWebSocket.getInstance();
  }

  start() {
    if (this.interval) {
      this.logger.warn(`Game ${this.room} already started`);
      return;
    }

    this.gameState.isRunning = true;
    this.interval = setInterval(() => {
      this.updateGame();
      this.io.to(this.room).emit("game:newState", this.gameState);
    }, 1000); //we will have to check decide at which rate we will update the game, we could add an option that will set the game speed
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.gameState.isRunning = false;
  }

  updateGame() {
    this.gameState.gamers.forEach((gamer) => {
      //our little tetris here :)
      this.logger.info(`checking input for player ${gamer.name}: ${JSON.stringify(gamer.input)}`);
    });
  }
}
