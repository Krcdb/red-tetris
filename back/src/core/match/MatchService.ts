import { Socket } from "socket.io";
import { Match } from "../types/match.js";
import { Player } from "../types/player.js";
import { getLogger } from "../utils/Logger.js";

type Matchs = Record<string, Match>;

class MatchService {
  matchs: Matchs;

  private logger = getLogger("MatchService");

  constructor() {
    this.matchs = {};
  }

  playerJoin(player: Player, room: string) {
    this.logger.info(`player ${player.name} try to join room ${room}`);
    if (!this.matchs[room]) {
      this.logger.info(`the room ${room} does not exist, new one is created`);
      this.matchs[room] = {
        player: [],
        roomName: room,
      };
    }
    if (this.matchs[room].player.find((elem) => elem.name === player.name)) {
      this.logger.info(`player name  ${player.name} is already taken`);
    } else {
      this.matchs[room].player.push(player);
    }
    this.logger.info(`player ${player.name} as joined the room | There is currently ${this.matchs[room].player.length} player in the room`);
  }

  playerLeave(player: Player, room: string) {
    const match = this.matchs[room];

    if (!match) {
      this.logger.warn(`Room ${room} does not exist`);
      return;
    }

    const beforeCount = match.player.length;
    match.player = match.player.filter((p) => p.name !== player.name);

    const afterCount = match.player.length;

    if (beforeCount === afterCount) {
      this.logger.warn(`Player ${player.name} was not found in room ${room}`);
    } else {
      this.logger.info(`Player ${player.name} left room ${room}`);
    }

    if (match.player.length === 0) {
      delete this.matchs[room];
      this.logger.info(`Room ${room} is empty and has been deleted`);
    }
  }
}

export const matchService = new MatchService();
