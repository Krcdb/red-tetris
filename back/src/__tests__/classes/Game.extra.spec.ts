import { beforeEach, describe, expect, it, vi } from "vitest";

const emitMock = vi.fn();
const toMock = vi.fn(() => ({ emit: emitMock }));

vi.mock("../../core/socket/websocket.js", () => ({
  default: {
    getInstance: vi.fn(() => ({
      to: toMock,
    })),
  },
}));

import { Game } from "../../core/classes/Game.js";
import { Piece } from "../../core/classes/Piece.js";
import { PENALTY_CELL } from "../../core/utils/tetris.js";

function makeDeterministicSequence(types: string[]): Piece[] {
  return types.map((t) => new Piece(t));
}

describe("Game (extra coverage)", () => {
  beforeEach(() => {
    emitMock.mockClear();
    toMock.mockClear();
    vi.restoreAllMocks();
  });

  describe("getGameState / getNextPiecesForPlayer", () => {
    it("returns a game state with gamers and slice of next pieces", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I", "L", "J", "S", "O", "Z"]),
      );
      const game = new Game("room1", ["Alice", "Bob"]);
      const state = game.getGameState();

      expect(state.room).toBe("room1");
      expect(state.isRunning).toBe(false);
      expect(state.isSolo).toBe(false);
      expect(state.gamers).toHaveLength(2);
      expect(state.gamers[0].name).toBe("Alice");
      expect(state.gamers[0].nextPieces.length).toBe(5);
      expect(state.gamers[0].nextPieces[0].type).toBe("T");
      expect(state.pieceSequenceLength).toBe(7);

      const next = game.getNextPiecesForPlayer(game.players[0], 3);
      expect(next).toHaveLength(3);
      expect(next[0].type).toBe("I");
    });
  });

  describe("computeSpectrum", () => {
    it("returns zeros for an empty grid", () => {
      const empty = Array.from({ length: 20 }, () => new Array<number>(10).fill(0));
      expect(Game.computeSpectrum(empty)).toEqual(new Array<number>(10).fill(0));
    });

    it("returns column heights measured from the topmost non-empty cell to the floor", () => {
      const grid = Array.from({ length: 20 }, () => new Array<number>(10).fill(0));
      // Column 0: topmost block at row 19 → height 1
      grid[19][0] = 1;
      // Column 3: topmost block at row 15 → height 5 (even with gaps below)
      grid[15][3] = 1;
      grid[18][3] = 1;
      // Column 9: topmost block at row 0 → height 20 (full column)
      for (let y = 0; y < 20; y++) grid[y][9] = 1;

      expect(Game.computeSpectrum(grid)).toEqual([1, 0, 0, 5, 0, 0, 0, 0, 0, 20]);
    });

    it("is included in getGameState gamers entries", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I", "L", "J", "S", "O"]),
      );
      const game = new Game("room1", ["Alice", "Bob"]);
      // Drop a block on Alice's bottom-right cell.
      const grid = Array.from({ length: 20 }, () => new Array<number>(10).fill(0));
      grid[19][9] = 1;
      game.players[0].updateGrid(grid);

      const state = game.getGameState();
      expect(state.gamers[0].spectrum).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
      expect(state.gamers[1].spectrum).toEqual(new Array<number>(10).fill(0));
    });
  });

  describe("areAllPlayersReady", () => {
    it("returns false until everyone is ready, then true", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I"]),
      );
      const game = new Game("r", ["A", "B"]);

      expect(game.areAllPlayersReady()).toBe(false);
      game.players[0].setReady();
      expect(game.areAllPlayersReady()).toBe(false);
      game.players[1].setReady();
      expect(game.areAllPlayersReady()).toBe(true);
    });
  });

  describe("setPlayerReady edge cases", () => {
    it("warns and returns false when player not in game", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T"]),
      );
      const game = new Game("r", ["A"]);
      expect(game.setPlayerReady("Unknown")).toBe(false);
    });

    it("returns true (no-op) when game already running", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T"]),
      );
      const game = new Game("r", ["A"]);
      game.isRunning = true;
      expect(game.setPlayerReady("A")).toBe(true);
      expect(game.players[0].isReady).toBe(false);
    });

    it("returns areAllPlayersReady when player is already ready", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T"]),
      );
      const game = new Game("r", ["A"]);
      game.players[0].setReady();
      expect(game.setPlayerReady("A")).toBe(true);
    });
  });

  describe("updatePlayerInput", () => {
    it("forwards new input to the matching player", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T"]),
      );
      const game = new Game("r", ["A"]);
      game.updatePlayerInput("A", {
        down: false,
        left: true,
        right: false,
        space: false,
        up: false,
      });
      expect(game.players[0].input.left).toBe(true);
    });

    it("silently ignores unknown player names", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T"]),
      );
      const game = new Game("r", ["A"]);
      expect(() => {
        game.updatePlayerInput("Ghost", {
          down: false,
          left: false,
          right: false,
          space: false,
          up: false,
        });
      }).not.toThrow();
    });
  });

  describe("giveNextPiece and growth", () => {
    it("appends more pieces when running low", () => {
      const initial = makeDeterministicSequence(Array(5).fill("T") as string[]);
      const spy = vi
        .spyOn(Piece, "generatePieceSequence")
        .mockReturnValueOnce(initial)
        .mockReturnValueOnce(makeDeterministicSequence(Array(100).fill("I") as string[]));

      const game = new Game("r", ["A"]);
      const player = game.players[0];

      // currentPieceIndex starts at 0; 5 - 20 < 0, so it will append on first call.
      game.giveNextPiece(player);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(player.currentPiece).not.toBeNull();
    });

    it("does nothing when player has already lost", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T"]),
      );
      const game = new Game("r", ["A"]);
      game.players[0].setHasLost();
      game.giveNextPiece(game.players[0]);
      expect(game.players[0].currentPiece).toBeNull();
    });

    it("triggers player loss when spawn position is blocked", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I"]),
      );
      const game = new Game("solo-r", ["A"]);
      // Fill the spawn area so no piece can be placed
      const blockedGrid = Array.from({ length: 20 }, () => new Array<number>(10).fill(1));
      game.players[0].updateGrid(blockedGrid);
      game.isRunning = true;

      game.giveNextPiece(game.players[0]);

      expect(game.players[0].hasLost).toBe(true);
      expect(emitMock).toHaveBeenCalledWith("game:over", { playerName: "A" });
      expect(game.isRunning).toBe(false);
    });
  });

  describe("processGravity", () => {
    it("moves the active piece down when there is space", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "T"]),
      );
      const game = new Game("solo-r", ["A"]);
      game.start();

      const startY = game.players[0].currentPiece!.y;
      game.processGravity();
      expect(game.players[0].currentPiece!.y).toBe(startY + 1);
    });

    it("does nothing when player has no current piece or game is not running", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T"]),
      );
      const game = new Game("r", ["A"]);
      expect(() => {
        game.processGravity();
      }).not.toThrow();
    });

    it("locks the piece after the lock delay when at the floor", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["O", "T"]),
      );
      const game = new Game("solo-r", ["A"]);
      game.start();

      // Drop the O piece to the floor (y=18 since O is 2 rows tall, board is 20)
      game.players[0].currentPiece!.y = 18;

      // First tick: marks touching ground, lockDelayCounter=0
      game.processGravity();
      expect(game.players[0].currentPiece!.type).toBe("O");

      // Second tick: lockDelayCounter >= LOCK_DELAY_TICKS so lock happens.
      // After lock, giveNextPiece is invoked and the next piece (T) is assigned.
      game.processGravity();
      expect(game.players[0].currentPiece!.type).toBe("T");
    });
  });

  describe("processPlayerInputsOnly", () => {
    it("rotates piece on 'up' input", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I"]),
      );
      const game = new Game("solo-r", ["A"]);
      game.start();

      const before = JSON.stringify(game.players[0].currentPiece!.shape);
      game.players[0].input.up = true;
      game.processPlayerInputsOnly();
      const after = JSON.stringify(game.players[0].currentPiece!.shape);
      expect(after).not.toBe(before);
      expect(game.players[0].input.upHasBeenCounted).toBe(true);
    });

    it("moves piece left, right, down on the respective inputs", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I"]),
      );
      const game = new Game("solo-r", ["A"]);
      game.start();

      const startX = game.players[0].currentPiece!.x;
      game.players[0].input.left = true;
      game.processPlayerInputsOnly();
      expect(game.players[0].currentPiece!.x).toBe(startX - 1);

      game.players[0].input.left = false;
      game.players[0].input.right = true;
      game.processPlayerInputsOnly();
      expect(game.players[0].currentPiece!.x).toBe(startX);

      game.players[0].input.right = false;
      game.players[0].input.down = true;
      const startY = game.players[0].currentPiece!.y;
      game.processPlayerInputsOnly();
      expect(game.players[0].currentPiece!.y).toBe(startY + 1);
    });

    it("hard-drops on space", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I"]),
      );
      const game = new Game("solo-r", ["A"]);
      game.start();

      game.players[0].input.space = true;
      game.processPlayerInputsOnly();
      expect(game.players[0].currentPiece!.y).toBeGreaterThan(0);
      expect(game.players[0].input.spaceHasBeenCounted).toBe(true);
      expect(game.players[0].forcedFall).toBe(true);
    });

    it("ignores players without a current piece", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T"]),
      );
      const game = new Game("solo-r", ["A"]);
      game.isRunning = true;
      expect(() => {
        game.processPlayerInputsOnly();
      }).not.toThrow();
    });
  });

  describe("multiplayer penalty lines + handlePlayerLoss", () => {
    it("sends penalty lines to other players when more than one line is cleared", () => {
      // Build a grid where the bottom 2 rows are almost full and dropping
      // an I piece vertically clears 2 lines.
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["I", "T", "L"]),
      );
      const game = new Game("room", ["A", "B"]);
      game.start();

      const playerA = game.players[0];
      // Fill bottom two rows except col 0
      const grid = Array.from({ length: 20 }, () => new Array<number>(10).fill(0));
      grid[18] = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      grid[19] = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      playerA.updateGrid(grid);

      // Place I-piece vertical at column 0 to fill those bottom holes
      playerA.currentPiece = {
        color: 1,
        rotation: 1,
        shape: [
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 1, 0, 0],
        ],
        type: "I",
        x: -1,
        y: 16,
      };
      playerA.isTouchingGround = true;
      playerA.lockDelayCounter = 5;
      playerA.input.down = false;

      const beforeBobLines = game.players[1].grid.filter((row) =>
        row.every((c) => c === PENALTY_CELL),
      ).length;

      game.processGravity();

      const afterBobPenalty = game.players[1].grid.filter((row) =>
        row.every((c) => c === PENALTY_CELL),
      ).length;

      // At least 1 penalty line was pushed onto Bob (2 cleared - 1 = 1 penalty)
      expect(afterBobPenalty).toBeGreaterThan(beforeBobLines);
      expect(playerA.linesCleared).toBeGreaterThanOrEqual(2);
      // Penalty lines must sit at the BOTTOM of the field (subject §V.1).
      expect(game.players[1].grid[19].every((c) => c === PENALTY_CELL)).toBe(true);
    });

    it("does not clear penalty lines even when the row is completed by the victim", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["I", "T", "L"]),
      );
      const game = new Game("room", ["A", "B"]);
      game.start();

      const victim = game.players[1];
      // Bottom row is a penalty line with a single hole at column 0; if it were
      // clearable, completing it would erase the indestructible row.
      const grid = Array.from({ length: 20 }, () => new Array<number>(10).fill(0));
      grid[19] = [0, PENALTY_CELL, PENALTY_CELL, PENALTY_CELL, PENALTY_CELL, PENALTY_CELL, PENALTY_CELL, PENALTY_CELL, PENALTY_CELL, PENALTY_CELL];
      victim.updateGrid(grid);

      // Drop an O-piece-shaped block into column 0 of the bottom row to complete it.
      victim.currentPiece = {
        color: 2,
        rotation: 0,
        shape: [
          [1, 0],
          [1, 0],
        ],
        type: "O",
        x: 0,
        y: 18,
      };
      victim.isTouchingGround = true;
      victim.lockDelayCounter = 5;
      victim.input.down = false;

      const beforePenalty = victim.grid.filter((row) =>
        row.includes(PENALTY_CELL),
      ).length;

      game.processGravity();

      const afterPenalty = victim.grid.filter((row) =>
        row.includes(PENALTY_CELL),
      ).length;

      expect(afterPenalty).toBe(beforePenalty);
      expect(victim.linesCleared).toBe(0);
    });

    it("emits game:over and stops when a multiplayer player loses leaving one alive", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I"]),
      );
      const game = new Game("room", ["A", "B"]);

      // Force player A loss; with only B remaining, the game should emit game:over and stop.
      const blockedGrid = Array.from({ length: 20 }, () => new Array<number>(10).fill(1));
      game.players[0].updateGrid(blockedGrid);
      game.isRunning = true;

      game.giveNextPiece(game.players[0]);

      expect(game.players[0].hasLost).toBe(true);
      expect(emitMock).toHaveBeenCalledWith("game:over", { playerName: "A" });
      expect(game.isRunning).toBe(false);
    });

    it("handlePlayerDisconnect marks leaver as lost and ends a 2-player game", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I"]),
      );
      const game = new Game("room", ["A", "B"]);
      game.isRunning = true;

      // A closes their tab mid-game; B is the only remaining player.
      game.handlePlayerDisconnect("A");

      expect(game.players[0].hasLost).toBe(true);
      expect(game.players[1].hasLost).toBe(false);
      expect(emitMock).toHaveBeenCalledWith("game:over", { playerName: "A" });
      expect(game.isRunning).toBe(false);
    });

    it("handlePlayerDisconnect with 3+ players removes the leaver but keeps the game running", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I"]),
      );
      const game = new Game("room", ["A", "B", "C"]);
      game.isRunning = true;

      game.handlePlayerDisconnect("B");

      expect(game.players[1].hasLost).toBe(true);
      expect(game.isRunning).toBe(true);
      expect(emitMock).not.toHaveBeenCalledWith("game:over", expect.anything());
    });

    it("handlePlayerDisconnect is a no-op for unknown or already-lost players", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T", "I"]),
      );
      const game = new Game("room", ["A", "B"]);
      game.isRunning = true;
      game.players[0].setHasLost();

      game.handlePlayerDisconnect("A"); // already lost
      game.handlePlayerDisconnect("ghost"); // unknown

      expect(game.isRunning).toBe(true);
      expect(emitMock).not.toHaveBeenCalledWith("game:over", expect.anything());
    });
  });

  describe("processPlayerActions", () => {
    it("exists and is callable (recursive, with no live players it returns)", () => {
      vi.spyOn(Piece, "generatePieceSequence").mockReturnValue(
        makeDeterministicSequence(["T"]),
      );
      const game = new Game("r", ["A"]);
      game.players[0].setHasLost();
      expect(() => {
        game.processPlayerActions();
      }).not.toThrow();
    });
  });
});
