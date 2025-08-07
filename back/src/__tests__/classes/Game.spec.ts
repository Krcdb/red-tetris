import { beforeEach, describe, expect, it, vi } from "vitest";

import { Game } from "../../core/classes/Game";
import { Piece } from "../../core/classes/Piece";
import { Player } from "../../core/classes/Player";

vi.mock("../utils/Logger.js", () => ({
  getLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock("../socket/websocket.js", () => {
  const mockIo = {
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
  };
  return {
    default: {
      getInstance: vi.fn(() => mockIo),
    },
  };
});

describe("Game", () => {
  let game: Game;

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(Piece, "generatePieceSequence").mockReturnValue([new Piece("T"), new Piece("I"), new Piece("L"), new Piece("J"), new Piece("S")]);

    game = new Game("room1", ["Alice", "Bob"]);
  });

  describe("Constructor and Initialization", () => {
    it("should create a multiplayer game with correct initial state", () => {
      expect(game.room).toBe("room1");
      expect(game.players).toHaveLength(2);
      expect(game.players[0]).toBeInstanceOf(Player);
      expect(game.players[0].name).toBe("Alice");
      expect(game.isSolo).toBe(false);
      expect(game.isRunning).toBe(false);
      expect(Piece.generatePieceSequence).toHaveBeenCalledWith(1000);
    });

    it("should create a solo game correctly", () => {
      const soloGame = new Game("solo-room", ["SoloPlayer"]);
      expect(soloGame.isSolo).toBe(true);
      expect(soloGame.players).toHaveLength(1);
    });
  });

  describe("Game Flow", () => {
    it("should start the game and give pieces to players", () => {
      game.start();
      expect(game.isRunning).toBe(true);
      expect(game.players[0].currentPiece).not.toBeNull();
      expect(game.players[0].currentPiece?.type).toBe("T");
      expect(game.players[1].currentPiece).not.toBeNull();
      expect(game.players[1].currentPiece?.type).toBe("T");
    });

    it("should stop the game", () => {
      game.isRunning = true;
      game.stop();
      expect(game.isRunning).toBe(false);
    });
  });

  describe("Player Management", () => {
    it("should get a player by name", () => {
      const player = game.getPlayer("Alice");
      expect(player).toBeInstanceOf(Player);
      expect(player?.name).toBe("Alice");
    });

    it("should return undefined for a non-existent player", () => {
      const player = game.getPlayer("Charlie");
      expect(player).toBeUndefined();
    });

    it("should set a player to ready and check if all are ready", () => {
      const alice = game.getPlayer("Alice")!;
      const bob = game.getPlayer("Bob")!;

      let allReady = game.setPlayerReady("Alice");
      expect(alice.isReady).toBe(true);
      expect(allReady).toBe(false);

      allReady = game.setPlayerReady("Bob");
      expect(bob.isReady).toBe(true);
      expect(allReady).toBe(true);
    });
  });
});
