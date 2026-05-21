import { beforeEach, describe, expect, it, vi } from "vitest";

const { createGameMock, emitMock, forceStopGameMock, isGameRunningMock, toMock } = vi.hoisted(
  () => {
    const emitMock = vi.fn();
    const toMock = vi.fn(() => ({ emit: emitMock }));
    return {
      createGameMock: vi.fn(),
      emitMock,
      forceStopGameMock: vi.fn(),
      isGameRunningMock: vi.fn(() => false),
      toMock,
    };
  },
);

vi.mock("../../core/socket/websocket.js", () => ({
  default: {
    getInstance: vi.fn(() => ({
      to: toMock,
    })),
  },
}));

vi.mock("../../core/game/GameService.js", () => ({
  gameService: {
    createGame: createGameMock,
    forceStopGame: forceStopGameMock,
    isGameRunning: isGameRunningMock,
  },
}));

import { matchService } from "../../core/match/MatchService.js";

const makeSocket = () =>
  ({
    data: {} as Record<string, unknown>,
    id: "sock-id",
    leave: vi.fn(),
  }) as never;

describe("MatchService (extra coverage)", () => {
  beforeEach(() => {
    matchService.matchs = {};
    emitMock.mockClear();
    toMock.mockClear();
    forceStopGameMock.mockClear();
    isGameRunningMock.mockReset();
    isGameRunningMock.mockReturnValue(false);
    createGameMock.mockClear();
  });

  describe("convenience getters", () => {
    it("getMatch returns null for unknown rooms", () => {
      expect(matchService.getMatch("nope")).toBeNull();
    });

    it("getPlayerCount returns 0 for unknown rooms", () => {
      expect(matchService.getPlayerCount("nope")).toBe(0);
    });

    it("getRoomNames lists current rooms", () => {
      matchService.playerJoin("A", "r1", makeSocket());
      matchService.playerJoin("B", "r2", makeSocket());
      expect(matchService.getRoomNames().sort()).toEqual(["r1", "r2"]);
    });

    it("isRoomFull returns true once max players is reached", () => {
      const socket = makeSocket();
      matchService.playerJoin("A", "r", socket);
      matchService.playerJoin("B", "r", makeSocket());
      expect(matchService.isRoomFull("r", 2)).toBe(true);
      expect(matchService.isRoomFull("r", 4)).toBe(false);
    });
  });

  describe("canPlayerStartGame", () => {
    it("returns true only for the leader", () => {
      matchService.playerJoin("Leader", "r", makeSocket());
      matchService.playerJoin("Other", "r", makeSocket());

      expect(matchService.canPlayerStartGame("Leader", "r")).toBe(true);
      expect(matchService.canPlayerStartGame("Other", "r")).toBe(false);
      expect(matchService.canPlayerStartGame("Leader", "missing")).toBe(false);
    });
  });

  describe("playerJoin validation", () => {
    it("throws if a game is already running in the room", () => {
      isGameRunningMock.mockReturnValue(true);
      expect(() => {
        matchService.playerJoin("A", "r", makeSocket());
      }).toThrowError(/already in game/);
    });

    it("rejects a mismatched game mode in the same room", () => {
      matchService.playerJoin("A", "r", makeSocket(), "normal");
      expect(() => {
        matchService.playerJoin("B", "r", makeSocket(), "speed");
      }).toThrowError(/mode/);
    });

    it("falls back to 'normal' on an invalid game mode and still joins", () => {
      const socket = makeSocket();
      const match = matchService.playerJoin("A", "r", socket, "not-real-mode");
      expect(match.gameMode).toBe("normal");
    });
  });

  describe("playerLeave leader promotion", () => {
    it("promotes the next player when the leader leaves", () => {
      const s1 = makeSocket();
      const s2 = makeSocket();
      matchService.playerJoin("Leader", "r", s1);
      matchService.playerJoin("Next", "r", s2);

      matchService.playerLeave("Leader", "r", s1);

      const match = matchService.getMatch("r");
      expect(match?.player[0].name).toBe("Next");
      expect(match?.player[0].isLeader).toBe(true);
      expect(emitMock).toHaveBeenCalledWith("match:newLeader", match);
    });
  });

  describe("startGame", () => {
    it("logs and bails when the room does not exist", () => {
      const socket = makeSocket();
      matchService.startGame("nope", socket);
      expect(createGameMock).not.toHaveBeenCalled();
    });

    it("only the leader can start the game", () => {
      const s1 = makeSocket();
      const s2 = makeSocket();
      matchService.playerJoin("Leader", "r", s1);
      matchService.playerJoin("Other", "r", s2);

      matchService.startGame("r", s2);
      expect(createGameMock).not.toHaveBeenCalled();

      matchService.startGame("r", s1);
      expect(createGameMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleDisconnect", () => {
    it("logs and returns early when there's no room/playerName on the socket", () => {
      const socket = makeSocket();
      expect(() => {
        matchService.handleDisconnect(socket, "transport close");
      }).not.toThrow();
    });

    it("invokes playerLeave and cleanup when room/player are known", () => {
      const socket = makeSocket();
      matchService.playerJoin("A", "r", socket);

      // Sanity: socket data was set
      expect((socket as unknown as { data: { currentRoom?: string } }).data.currentRoom).toBe("r");

      matchService.handleDisconnect(socket, "transport close");

      // Room should now be deleted
      expect(matchService.getMatch("r")).toBeNull();
      // cleanupGameIfNeeded should have force-stopped the game
      expect(forceStopGameMock).toHaveBeenCalledWith("r");
    });
  });

  describe("forceCleanPlayer", () => {
    it("removes the player from every room they're in and clears socket data", () => {
      const sA = makeSocket();
      matchService.playerJoin("Ghost", "r1", sA);
      // Manually add Ghost to another room as well
      matchService.matchs.r2 = {
        gameMode: "normal",
        player: [{ isLeader: true, name: "Ghost" }],
        roomName: "r2",
      };

      matchService.forceCleanPlayer("Ghost", sA);

      expect(matchService.getMatch("r1")).toBeNull();
      expect(matchService.getMatch("r2")).toBeNull();
      const data = (sA as unknown as { data: Record<string, unknown> }).data;
      expect(data.currentRoom).toBeUndefined();
      expect(data.playerName).toBeUndefined();
      expect(data.gameMode).toBeUndefined();
    });
  });
});
