import { gameService } from "../game/GameService.js";
import MyWebSocket from "../socket/websocket.js";
import { Match } from "../types/match.js";
import { CustomeSocket } from "../types/socket-event.js";
import { getLogger } from "../utils/Logger.js";

type Matchs = { [key: string]: Match };

class MatchService {
  matchs: Matchs;
  private logger = getLogger("MatchService");

  constructor() {
    this.matchs = {};
  }

  playerJoin(playerName: string, room: string, socket: CustomeSocket): Match {
    this.logger.info(`player ${playerName} tries to join room ${room}`);

    /* --- If the socket is already in a room, leave that one first --- */
    if (socket.data.currentRoom !== undefined) {
      const oldPlayerName = socket.data.playerName!;
      const oldRoom = socket.data.currentRoom;

      this.logger.info(
        `player ${oldPlayerName} is already in ${oldRoom}, leaving first`,
      );

      this.playerLeave(oldPlayerName, oldRoom, socket);

      const io = MyWebSocket.getInstance();
      const oldMatch = this.matchs[oldRoom];
      socket.leave(oldRoom);
      if (oldMatch) io.to(oldRoom).emit("match:playerHasLeft", oldMatch);
    }

    /* --- Create room entry if needed --- */
    if (!this.matchs[room]) {
      this.logger.info(`room ${room} does not exist – creating it`);
      this.matchs[room] = { player: [], roomName: room };
    }

    /* --- Reject duplicate names --- */
    if (this.matchs[room].player.some((p) => p.name === playerName)) {
      this.logger.info(`player name ${playerName} is already taken`);
      throw new Error("Name already taken");
    }

    /* --- Add the player --- */
    const isFirstPlayer = this.matchs[room].player.length === 0;
    this.matchs[room].player.push({
      name: playerName,
      isLeader: isFirstPlayer,
      isReady: false,
    });

    socket.data.currentRoom = room;
    socket.data.playerName = playerName;

    this.logger.info(
      `player ${playerName} joined room ${room} as ${
        isFirstPlayer ? "LEADER" : "member"
      } | total players: ${this.matchs[room].player.length}`,
    );

    return this.matchs[room];
  }

  /** Remove a player from a room and clean up leader/game state if needed. */
  playerLeave(
    playerName: string,
    room: string,
    socket: CustomeSocket,
  ): Match | undefined {
    const match = this.matchs[room];
    if (!match) {
      this.logger.info(`room ${room} not found for deletion`);
      return;
    }

    const leavingPlayer = match.player.find((p) => p.name === playerName);
    const wasLeader = leavingPlayer?.isLeader ?? false;
    const beforeCount = match.player.length;

    match.player = match.player.filter((p) => p.name !== playerName);

    if (beforeCount === match.player.length) {
      this.logger.warn(`player ${playerName} not found in room ${room}`);
      return match;
    }

    this.logger.info(`player ${playerName} left room ${room}`);
    socket.data.currentRoom = undefined;
    socket.data.playerName = undefined;

    /* --- Promote a new leader if needed --- */
    if (wasLeader && match.player.length > 0) {
      match.player[0].isLeader = true;
      this.logger.info(
        `player ${match.player[0].name} promoted to leader in room ${room}`,
      );
      MyWebSocket.getInstance().to(room).emit("match:newLeader", match);
    }

    /* --- Delete empty rooms and stop games --- */
    if (match.player.length === 0) {
      delete this.matchs[room];
      this.logger.info(`room ${room} is empty and has been deleted`);
      gameService.forceStopGame(room);
      return;
    }

    return match;
  }

  /** Only the leader can start the game. */
  startGame(room: string, socket: CustomeSocket) {
    const match = this.matchs[room];
    if (!match) {
      this.logger.error(`cannot start match ${room}: room not found`);
      return;
    }

    const isLeader = match.player.find(
      (p) => p.name === socket.data.playerName,
    )?.isLeader;

    if (isLeader) {
      gameService.createGame(match.player, room);
    } else {
      this.logger.warn(
        `startGame denied: player ${socket.data.playerName} is not leader`,
      );
    }
  }

  /* ---------- convenience getters ---------- */

  getMatch(room: string): Match | null {
    return this.matchs[room] ?? null;
  }

  canPlayerStartGame(playerName: string, room: string): boolean {
    return !!this.matchs[room]?.player.find(
      (p) => p.name === playerName && p.isLeader,
    );
  }

  getRoomNames(): string[] {
    return Object.keys(this.matchs);
  }

  getPlayerCount(room: string): number {
    return this.matchs[room]?.player.length ?? 0;
  }

  isRoomFull(room: string, maxPlayers = 4): boolean {
    return this.getPlayerCount(room) >= maxPlayers;
  }

  /* ---------- socket-disconnect cleanup ---------- */

  handleDisconnect(socket: CustomeSocket, reason: string) {
    const playerName = socket.data.playerName;
    const room = socket.data.currentRoom;

    if (!playerName || !room) {
      this.logger.info(`socket ${socket.id} disconnected (no room)`);
      return;
    }

    this.logger.info(
      `player ${playerName} disconnected from room ${room} (${reason})`,
    );

    this.playerLeave(playerName, room, socket);
    this.cleanupGameIfNeeded(room);
  }

  private cleanupGameIfNeeded(room: string) {
    const match = this.matchs[room];

    if (!match) {
      this.logger.info(`room ${room} deleted – cleaning up game`);
      gameService.forceStopGame(room);
    } else if (match.player.length === 0) {
      this.logger.info(`room ${room} empty – cleaning up game`);
      gameService.forceStopGame(room);
    }
  }
}

export const matchService = new MatchService();
