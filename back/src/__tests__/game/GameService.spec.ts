import { beforeEach, describe, expect, it, vi } from "vitest";

import { gameService } from "../../core/game/GameService.js";
import { TetrisGameLoop } from "../../core/tetris/TetrisGameLoop.js";
import { Player } from "../../core/types/player.js";

const emitMock = vi.fn();
const toMock = vi.fn(() => ({ emit: emitMock }));

vi.mock("../../core/socket/websocket", () => {
  return {
    default: {
      getInstance: () => ({
        to: toMock,
      }),
    },
  };
});

vi.mock("../../core/tetris/TetrisGameLoop", () => {
  return {
    TetrisGameLoop: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    })),
  };
});

describe("GameService", () => {
  const players: Player[] = [
    { name: "bob", isLeader: true },
    { name: "alice", isLeader: false },
  ];
  const room = "test-room";

  beforeEach(() => {
    (gameService as any).games = {};
    (gameService as any).gameLoops = {};
    emitMock.mockClear();
    toMock.mockClear();
  });

  it("should create and launch the game", () => {
    gameService.createGame(players, room);
    gameService.launchGame(room);

    expect(TetrisGameLoop).toHaveBeenCalledWith(expect.anything(), room);
  });

  it("should mark players ready and start game when all ready", () => {
    gameService.createGame(players, room);
    gameService.playerReady("bob", room);

    expect(emitMock).not.toHaveBeenCalledWith("game:isLaunching");

    gameService.playerReady("alice", room);

    expect(emitMock).toHaveBeenCalledWith("game:isLaunching");
  });

  it("should log and throw when calling playerReady on unknown room", () => {
    expect(() => {
      gameService.playerReady("bob", "unknown-room");
    }).toThrowError(/not found/);
  });

  it("should do nothing if playerInputChange called with unknown room", () => {
    expect(() => {
      gameService.playerInputChange("bob", "unknown-room", {
        down: false,
        left: false,
        right: false,
        space: false,
        up: false,
      });
    }).not.toThrow();
  });

  it("should force stop a running game", () => {
    gameService.createGame(players, room);
    gameService.launchGame(room);
    gameService.forceStopGame(room);

    expect((gameService as any).games[room]).toBeUndefined();
    expect((gameService as any).gameLoops[room]).toBeUndefined();
  });
});
