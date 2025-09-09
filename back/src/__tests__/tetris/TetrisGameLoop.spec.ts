import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TetrisGameLoop } from "../../core/tetris/TetrisGameLoop";
import { gameService } from "../../core/game/GameService.js";

const mockGame = {
  isRunning: true,
  players: [
    { name: "Alice", linesCleared: 0 },
    { name: "Bob", linesCleared: 0 },
  ],
  processGravity: vi.fn(),
  processPlayerInputsOnly: vi.fn(),
  getGameState: vi.fn(() => ({})),
  stop: vi.fn(),
};

vi.mock("../../core/game/GameService.js", () => ({
  gameService: {
    getGame: vi.fn(() => mockGame),
    sendGameState: vi.fn(),
  },
}));

vi.mock("../../core/socket/websocket.js", () => {
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

vi.mock("../../core/utils/Logger.js", () => ({
  getLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe("TetrisGameLoop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global, 'setInterval');
    vi.spyOn(global, 'clearInterval');
    mockGame.isRunning = true;
    mockGame.players = [
      { name: "Alice", linesCleared: 0 },
      { name: "Bob", linesCleared: 0 },
    ];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Constructor", () => {
    it("should initialize with default gameMode 'normal'", () => {
      const loop = new TetrisGameLoop({}, "room1");
      // @ts-expect-error private property for the test
      expect(loop.gameMode).toBe("normal");
    });

    it("should initialize with the specified gameMode", () => {
      const loop = new TetrisGameLoop({}, "room1", "speed");
      // @ts-expect-error private property for the test
      expect(loop.gameMode).toBe("speed");
    });
  });

  describe("start", () => {
    it("should set up two intervals: one for inputs and one for gravity", () => {
      const loop = new TetrisGameLoop({}, "room1");
      loop.start();

      expect(setInterval).toHaveBeenCalledTimes(2);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 100);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 500);

      loop.stop();
    });

    it("should not start new intervals if the game is already running", () => {
      const loop = new TetrisGameLoop({}, "room1");
      loop.start();
      expect(setInterval).toHaveBeenCalledTimes(2);

      loop.start();
      expect(setInterval).toHaveBeenCalledTimes(2);

      loop.stop();
    });
  });

  describe("stop", () => {
    it("should clear all intervals", () => {
      const loop = new TetrisGameLoop({}, "room1");
      loop.start();

      loop.stop();
      expect(clearInterval).toHaveBeenCalledTimes(2);
    });
  });

  describe("Game Loop Execution", () => {
    it("should process inputs and send game state every 100ms", () => {
      const loop = new TetrisGameLoop({}, "room1");
      loop.start();

      vi.advanceTimersByTime(100);
      expect(gameService.getGame).toHaveBeenCalled();
      expect(mockGame.processPlayerInputsOnly).toHaveBeenCalledTimes(1);
      expect(gameService.sendGameState).toHaveBeenCalledTimes(1); // 1 pour l'input

      vi.advanceTimersByTime(100);
      expect(mockGame.processPlayerInputsOnly).toHaveBeenCalledTimes(2);
      expect(gameService.sendGameState).toHaveBeenCalledTimes(2); // 2 pour l'input

      loop.stop();
    });

    it("should process gravity and send game state every 500ms in normal mode", () => {
      const loop = new TetrisGameLoop({}, "room1", "normal");
      loop.start();

      vi.advanceTimersByTime(499);
      expect(mockGame.processGravity).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockGame.processGravity).toHaveBeenCalledTimes(1);
      expect(gameService.sendGameState).toHaveBeenCalledTimes(5 + 1);

      loop.stop();
    });

    it("should stop itself if the game is no longer running", () => {
      const loop = new TetrisGameLoop({}, "room1");
      loop.start();

      mockGame.isRunning = false;

      vi.advanceTimersByTime(100);

      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe("Speed Mode Logic", () => {
    it("should calculate a faster gravity speed based on average lines cleared", () => {
      mockGame.players = [
        { name: "Alice", linesCleared: 20 },
        { name: "Bob", linesCleared: 30 },
      ];
      const loop = new TetrisGameLoop({}, "room1", "speed");
      loop.start();

      const expectedSpeed = 80;

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expectedSpeed);

      loop.stop();
    });

    it("should dynamically update gravity speed as players clear more lines", () => {
      const loop = new TetrisGameLoop({}, "room1", "speed");
      loop.start();

      expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 100);

      vi.advanceTimersByTime(100);
      expect(mockGame.processGravity).toHaveBeenCalledTimes(1);
      expect(clearInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenCalledTimes(3);

      mockGame.players[0].linesCleared = 100;
      
      vi.advanceTimersByTime(100);
      
      const expectedNewSpeed = 100;
      expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), expectedNewSpeed);

      loop.stop();
    });
  });
});