import { Match } from "../../types/match";
import { getLogger } from "../../utils/Logger";

type Matchs = Record<string, Match>;

class MatchService {
  matchs: Matchs;

  private logger = getLogger("MatchService");

  constructor() {
    this.matchs = {};
  }

  playerJoin(player: string, room: string) {
    this.logger.info(`player ${player} try to join room ${room}`);
    if (!this.matchs[room]) {
      this.logger.info(`the room ${room} does not exist, new one is created`);
      this.matchs[room] = {
        player: [],
        roomName: room,
      };
    }
    if (this.matchs[room].player.find((elem) => elem.name === player)) {
      this.logger.info(`player name  ${player} is already taken`);
    } else {
      this.matchs[room].player.push({ name: player });
    }
    this.logger.info(`player ${player} as joined the room | There is currently ${this.matchs[room].player.length} player in the room`);
  }

  playerLeave(player: string, room: string) {
    const match = this.matchs[room];

    if (!match) {
      this.logger.warn(`Room ${room} does not exist`);
      return;
    }

    const beforeCount = match.player.length;
    match.player = match.player.filter((p) => p.name !== player);

    const afterCount = match.player.length;

    if (beforeCount === afterCount) {
      this.logger.warn(`Player ${player} was not found in room ${room}`);
    } else {
      this.logger.info(`Player ${player} left room ${room}`);
    }

    if (match.player.length === 0) {
      delete this.matchs[room];
      this.logger.info(`Room ${room} is empty and has been deleted`);
    }
  }
}

export const matchService = new MatchService();
