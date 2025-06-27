import { gameService } from "../game/GameService.js";
import MyWebSocket from "../socket/websocket.js";
import { Match } from "../types/match.js";
import { CustomeSocket } from "../types/socket-event.js";
import { getLogger } from "../utils/Logger.js";

type Matchs = { [key:string]: Match };

class MatchService {
  matchs: Matchs;

  private logger = getLogger("MatchService");

  constructor() {
    this.matchs = {};
  }

  playerJoin(playerName: string, room: string, socket: CustomeSocket): Match {
    this.logger.info(`player ${playerName} try to join room ${room}`);

    if (socket.data.currentRoom !== undefined) {
      const oldPlayerName = socket.data.playerName!;
      const oldRoom = socket.data.currentRoom;
      this.logger.info(`player ${oldPlayerName} is already in ${oldRoom}`);
      this.playerLeave(oldPlayerName, oldRoom, socket);
      const io = MyWebSocket.getInstance();
      socket.leave(oldRoom);
      if (this.matchs[oldRoom]) {
        io.to(oldRoom).emit("match:playerHasLeft", this.matchs[oldRoom]);
      }
    }
    if (!this.matchs[room]) {
      this.logger.info(`the room ${room} does not exist, new one is created`);
      this.matchs[room] = {
        player: [],
        roomName: room,
      };
    }
    if (this.matchs[room].player.find((elem) => elem.name === playerName)) {
      this.logger.info(`player name  ${playerName} is already taken`);
      throw new Error("Name already taken");
    } else {
      const isLeader = this.matchs[room].player.length === 0
      this.matchs[room].player.push({ name: playerName, isLeader });
    }
    socket.data.currentRoom = room;
    socket.data.playerName = playerName;

    this.logger.info(`player ${playerName} as joined the room | There is currently ${this.matchs[room].player.length} player in the room`);
    return (this.matchs[room]) ;
  }

  playerLeave(playerName: string, room: string, socket: CustomeSocket): Match | undefined {
    const match = this.matchs[room];

    if (!match) {
      this.logger.info(`room ${room} not found for deletion`);
      return ;
    }

    const beforeCount = match.player.length;
    match.player = match.player.filter((p) => p.name !== playerName);

    const afterCount = match.player.length;

    if (beforeCount === afterCount) {
      this.logger.warn(`Player ${playerName} was not found in room ${room}`);
      return ;
    } else {
      this.logger.info(`Player ${playerName} left room ${room}`);
      socket.data.currentRoom = undefined;
      socket.data.playerName = undefined;
    }

    if (match.player.length === 0) {
      delete this.matchs[room];
      this.logger.info(`Room ${room} is empty and has been deleted`);
    } else {
      match.player[0].isLeader = true;
      return match;
    }
  }

  startGame(room: string, socket: CustomeSocket) {
    if (!this.matchs[room]) {
      this.logger.error(`cannot start match ${room}, room not found`);
      return;
    }

    const isLeader = this.matchs[room].player.find(elem => elem.name === socket.data.playerName)?.isLeader;
    if (isLeader) {
      gameService.createGame(this.matchs[room].player, room);
    } else {
      this.logger.warn(`Try to start the game but player ${socket.data.playerName} is not the leader`)
    }
  }
}

export const matchService = new MatchService();
