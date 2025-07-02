import { beforeEach, describe, expect, it, vi } from "vitest";

import { gameService } from "../../core/game/GameService.js";
import { TetrisGameLoop } from "../../core/tetris/TetrisGameLoop.js";
import { Player } from "../../core/types/player.js";
import { Gamer } from "../../core/types/game.js";

const emitMock = vi.fn();
const toMock = vi.fn(() => ({ emit: emitMock }));
const getInstanceMock = vi.fn(() => ({ to: toMock }));

vi.mock("../../core/socket/websocket", () => {
  return {
    default: {
      getInstance: () => ({
        to: () => ({
          emit: emitMock,
        }),
      }),
    },
  };
});

vi.mock("../../core/tetris/TetrisGameLoop", () => {
  return {
    TetrisGameLoop: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
    })),
  };
});

describe("GameService", () => {
  const players: Player[] = [{ name: "bob", isLeader: true }, { name: "alice", isLeader: false }];
  const room = "test-room";

  beforeEach(() => {
    (gameService as any).games = {};
    (gameService as any).gameLoops = {};
    emitMock.mockClear();
    toMock.mockClear();
    getInstanceMock.mockClear();
  });

  it("should launch the game and start loop", () => {
    gameService.createGame(players, room);
    gameService.launchGame(room);

    expect(TetrisGameLoop).toHaveBeenCalledWith(expect.anything(), room);
  });

  it("should mark a player ready and not start game until all are ready", () => {
    gameService.createGame(players, room);
    gameService.playerReady("bob", room);

    const state = (gameService as any).games[room];
    const bob = state.gamers.find((g: Gamer) => g.name === "bob");
    expect(bob?.isReady).toBe(true);

    expect(emitMock).not.toHaveBeenCalledWith("game:isLaunching");

    gameService.playerReady("alice", room);

    expect(emitMock).toHaveBeenCalledWith("game:isLaunching");
  });

  it("should throw if playerReady called with unknown player", () => {
    gameService.createGame(players, room);

    expect(() => {
      gameService.playerReady("charlie", room);
    }).toThrowError(/couldn't find player charlie/);
  });

  it("should update player input", () => {
    gameService.createGame(players, room);
    const input = {
      down: false,
      left: false,
      right: false,
      space: true,
      spaceHasBeenCounted: true,
      up: true,
      upHasBeenCounted: false,
    };

    gameService.playerInputChange("bob", room, input);
    const player = (gameService as any).games[room].gamers.find((p: Player) => p.name === "bob");
    expect(player?.input).toEqual(input);
  });

  it("should throw if playerInputChange called with unknown player", () => {
    gameService.createGame(players, room);

    expect(() => {
      gameService.playerInputChange("charlie", room, {
        down: false,
        left: false,
        right: false,
        space: false,
        spaceHasBeenCounted: false,
        up: false,
        upHasBeenCounted: false,
      });
    }).toThrowError(/couldn't find player charlie/);
  });
});
