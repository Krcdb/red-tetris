import { gameService } from "../game/GameService.js";
import MyWebSocket from "../socket/websocket.js";
import { Match } from "../types/match.js";
import { CustomeSocket } from "../types/socket-event.js";
import { getLogger } from "../utils/Logger.js";

type Matchs = Record<string, Match>;

const VALID_GAME_MODES = ["normal", "invisible", "no-preview", "speed"] as const;
type GameMode = (typeof VALID_GAME_MODES)[number];

class MatchService {
  matchs: Matchs;
  private logger = getLogger("MatchService");

  constructor() {
    this.matchs = {};
  }

  canPlayerStartGame(playerName: string, room: string): boolean {
    return !!this.matchs[room]?.player.find((p) => p.name === playerName && p.isLeader);
  }

  forceCleanPlayer(playerName: string, socket: CustomeSocket): void {
    this.logger.info(`Force cleaning player ${playerName} from all rooms`);

    Object.keys(this.matchs).forEach((room) => {
      const match = this.matchs[room];
      if (match.player.some((p) => p.name === playerName)) {
        this.logger.info(`Removing ${playerName} from room ${room}`);
        this.playerLeave(playerName, room, socket);
      }
    });

    // Clear socket data completely
    socket.data.currentRoom = undefined;
    socket.data.playerName = undefined;
    socket.data.gameMode = undefined;
  }

  getMatch(room: string): Match | null {
    return this.matchs[room] ?? null;
  }

  getPlayerCount(room: string): number {
    return this.matchs[room]?.player.length ?? 0;
  }

  /* ---------- convenience getters ---------- */

  getRoomNames(): string[] {
    return Object.keys(this.matchs);
  }

  handleDisconnect(socket: CustomeSocket, reason: string) {
    const playerName = socket.data.playerName;
    const room = socket.data.currentRoom;

    if (!playerName || !room) {
      this.logger.info(`socket ${socket.id} disconnected (no room)`);
      return;
    }

    this.logger.info(`player ${playerName} disconnected from room ${room} (${reason})`);

    this.playerLeave(playerName, room, socket);
    this.cleanupGameIfNeeded(room);
  }

  isRoomFull(room: string, maxPlayers = 4): boolean {
    return this.getPlayerCount(room) >= maxPlayers;
  }

  playerJoin(playerName: string, room: string, socket: CustomeSocket, gameMode?: string): Match {
    this.logger.info(`player ${playerName} tries to join room ${room} with mode ${gameMode}`);

    const validatedGameMode = gameMode ? validateGameMode(gameMode) : "normal";
    const hasActiveGame = gameService.isGameRunning(room);

    // ✅ Check game mode consistency for ANY existing room (active game or not)
    this.logger.debug(`Active game ${hasActiveGame}`)
    if (hasActiveGame) {
      throw new Error(`Room ${room} is already in game, please wait for the game to finish.`)
    }
    if (this.matchs[room]) {
      if (this.matchs[room].gameMode !== validatedGameMode) {
        const errorMessage = hasActiveGame
          ? `Room ${room} has an active game using ${this.matchs[room].gameMode} mode. Please wait for the game to finish or select the same mode.`
          : `Room ${room} is set to ${this.matchs[room].gameMode} mode. Please select the same mode to join.`;

        this.logger.warn(
          `Player ${playerName} tried to join room ${room} with mode ${validatedGameMode}, but room is using ${this.matchs[room].gameMode}`,
        );
        throw new Error(errorMessage);
      }
    }

    if (gameMode && gameMode !== validatedGameMode) {
      this.logger.warn(`Invalid game mode "${gameMode}" provided, using "${validatedGameMode}"`);
    }

    socket.data.gameMode = validatedGameMode;

    /* --- If the socket is already in a room, leave that one first --- */
    if (socket.data.currentRoom !== undefined) {
      const oldPlayerName = socket.data.playerName!;
      const oldRoom = socket.data.currentRoom;

      this.logger.info(`player ${oldPlayerName} is already in ${oldRoom}, leaving first`);

      this.playerLeave(oldPlayerName, oldRoom, socket);

      const io = MyWebSocket.getInstance();
      const oldMatch = this.matchs[oldRoom];
      socket.leave(oldRoom);
      if (oldMatch) io.to(oldRoom).emit("match:playerHasLeft", oldMatch);
    }

    /* --- Create room entry if needed --- */
    if (!this.matchs[room]) {
      this.logger.info(`room ${room} does not exist – creating it with mode ${validatedGameMode}`);
      this.matchs[room] = { gameMode: validatedGameMode, player: [], roomName: room };
    }

    /* --- Reject duplicate names --- */
    if (this.matchs[room].player.some((p) => p.name === playerName)) {
      this.logger.info(`player name ${playerName} is already taken`);
      throw new Error("Name already taken");
    }

    /* --- Add the player --- */
    const isFirstPlayer = this.matchs[room].player.length === 0;
    this.matchs[room].player.push({
      isLeader: isFirstPlayer,
      isReady: false,
      name: playerName,
    });

    socket.data.currentRoom = room;
    socket.data.playerName = playerName;

    this.logger.info(
      `player ${playerName} joined room ${room} as ${isFirstPlayer ? "LEADER" : "member"} | total players: ${this.matchs[room].player.length}`,
    );

    return this.matchs[room];
  }

  /** Remove a player from a room and clean up leader/game state if needed. */
  playerLeave(playerName: string, room: string, socket: CustomeSocket): Match | undefined {
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
    socket.data.gameMode = undefined;

    /* --- Promote a new leader if needed --- */
    if (wasLeader && match.player.length > 0) {
      match.player[0].isLeader = true;
      this.logger.info(`player ${match.player[0].name} promoted to leader in room ${room}`);
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

    const playerData = match.player.find((p) => p.name === socket.data.playerName);
    const isLeader = playerData?.isLeader;

    // 🔍 Add detailed logging
    console.log(`🎯 MATCH START GAME DEBUG:`);
    console.log(`  - Room: ${room}`);
    console.log(`  - Socket player name: "${socket.data.playerName}"`);
    console.log(`  - Socket game mode: "${socket.data.gameMode}"`);
    console.log(`  - Match game mode: "${match.gameMode}"`);
    console.log(`  - Player is leader: ${isLeader}`);

    if (isLeader) {
      // Use the match's game mode instead of the socket's
      const gameMode = match.gameMode || "normal";

      console.log(`  - Final gameMode being passed: "${gameMode}"`);

      gameService.createGame(match.player, room, gameMode);
    } else {
      this.logger.warn(`startGame denied: player ${socket.data.playerName} is not leader`);
    }
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

function isValidGameMode(mode: string): mode is GameMode {
  return VALID_GAME_MODES.includes(mode as GameMode);
}

function validateGameMode(mode: string, fallback: GameMode = "normal"): GameMode {
  if (isValidGameMode(mode)) {
    return mode;
  }
  console.warn(`Invalid game mode "${mode}", falling back to "${fallback}"`);
  return fallback;
}

export const matchService = new MatchService();
