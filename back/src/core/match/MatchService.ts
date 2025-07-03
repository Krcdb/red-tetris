import { Match } from "../types/match.js";
import { getLogger } from "../utils/Logger.js";
import { CustomeSocket } from "../types/socket-event.js";
import { gameService } from "../game/GameService.js";
import MyWebSocket from "../socket/websocket.js";

type Matchs = Record<string, Match>;

class MatchService {
  matchs: Matchs;
  private logger = getLogger("MatchService");

  constructor() {
    this.matchs = {};
  }

  playerJoin(playerName: string, room: string, socket: CustomeSocket) {
    this.logger.info(`player ${playerName} try to join room ${room}`);

    if (socket.data.currentRoom !== undefined) {
      const oldPlayerName = socket.data.playerName!;
      const oldRoom = socket.data.currentRoom;
      this.logger.info(`player ${oldPlayerName} is already in ${oldRoom}`);
      this.playerLeave(oldPlayerName, oldRoom, socket);
      const io = MyWebSocket.getInstance();
      const match = this.getMatch(oldRoom);
      if (match) {
        io.to(oldRoom).emit("match:playerHasLeft", match);
      }
      socket.leave(oldRoom);
    }

    if (!this.matchs[room]) {
      this.logger.info(`the room ${room} does not exist, new one is created`);
      this.matchs[room] = {
        player: [],
        roomName: room,
      };
    }

    if (this.matchs[room].player.find((elem) => elem.name === playerName)) {
      this.logger.info(`player name ${playerName} is already taken`);
      throw new Error("Name already taken");
    }

    const isFirstPlayer = this.matchs[room].player.length === 0;

    this.matchs[room].player.push({
      name: playerName,
      isLeader: isFirstPlayer,
      isReady: false,
    });

    socket.data.currentRoom = room;
    socket.data.playerName = playerName;

    this.logger.info(
      `player ${playerName} joined room ${room} as ${isFirstPlayer ? "LEADER" : "member"} | Total players: ${this.matchs[room].player.length}`,
    );

    return this.matchs[room];
  }

  playerLeave(playerName: string, room: string, socket: CustomeSocket) {
    const match = this.matchs[room];

    if (!match) {
      this.logger.info(`room ${room} not found for deletion`);
      return null;
    }

    const beforeCount = match.player.length;
    const leavingPlayer = match.player.find((p) => p.name === playerName);
    const wasLeader = leavingPlayer?.isLeader || false;

    match.player = match.player.filter((p) => p.name !== playerName);

    const afterCount = match.player.length;

    if (beforeCount === afterCount) {
      this.logger.warn(`Player ${playerName} was not found in room ${room}`);
      return match;
    } else {
      this.logger.info(`Player ${playerName} left room ${room}`);
      socket.data.currentRoom = undefined;
      socket.data.playerName = undefined;
    }

    if (wasLeader && match.player.length > 0) {
      match.player[0].isLeader = true;
      this.logger.info(`Player ${match.player[0].name} promoted to leader in room ${room}`);

      const io = MyWebSocket.getInstance();
      io.to(room).emit("match:newLeader", match);
    }

    if (match.player.length === 0) {
      delete this.matchs[room];
      this.logger.info(`Room ${room} is empty and has been deleted`);

      this.logger.info(`🔍 About to call gameService.forceStopGame for room ${room}`);
      gameService.forceStopGame(room);
      this.logger.info(`🔍 Finished calling gameService.forceStopGame for room ${room}`);

      return null;
    }

    return match;
  }

  startGame(room: string) {
    if (!this.matchs[room]) {
      this.logger.error(`cannot start match ${room}, room not found`);
      return;
    }

    gameService.createGame(this.matchs[room].player, room);
  }

  getMatch(room: string): Match | null {
    return this.matchs[room] || null;
  }

  canPlayerStartGame(playerName: string, room: string): boolean {
    const match = this.matchs[room];
    if (!match) return false;

    const player = match.player.find((p) => p.name === playerName);
    return player?.isLeader || false;
  }

  getRoomNames(): string[] {
    return Object.keys(this.matchs);
  }

  getPlayerCount(room: string): number {
    const match = this.matchs[room];
    return match ? match.player.length : 0;
  }

  isRoomFull(room: string, maxPlayers: number = 4): boolean {
    return this.getPlayerCount(room) >= maxPlayers;
  }

  handleDisconnect(socket: CustomeSocket, reason: string) {
    const playerName = socket.data.playerName;
    const room = socket.data.currentRoom;

    if (!playerName || !room) {
      this.logger.info(`Socket ${socket.id} disconnected but was not in any room`);
      return;
    }

    this.logger.info(`Player ${playerName} disconnected from room ${room} (reason: ${reason})`);

    this.playerLeave(playerName, room, socket);

    this.cleanupGameIfNeeded(room);
  }

  private cleanupGameIfNeeded(room: string) {
    const match = this.matchs[room];

    if (!match) {
      this.logger.info(`Room ${room} was deleted, cleaning up associated game`);
      gameService.forceStopGame(room);
      return;
    }

    if (match.player.length > 0) {
      this.logger.info(`Room ${room} still has ${match.player.length} players, keeping game running`);
      return;
    }
  }
}

export const matchService = new MatchService();
