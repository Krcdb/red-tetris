import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import { TetrisGameLoop } from "../../core/tetris/TetrisGameLoop.js";
import { gameService } from "../../core/game/GameService.js";


// Mocks
const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
};
const emitMock = vi.fn();
const toMock = vi.fn(() => ({ emit: emitMock }));
const getInstanceMock = vi.fn(() => ({ to: toMock }));

// Fake game state with minimal shape
const mockGame = {
  isRunning: true,
  processPlayerInputsOnly: vi.fn(),
  processGravity: vi.fn(),
  processPlayerActions: vi.fn(),
  stop: vi.fn(),
  getGameState: vi.fn(() => ({
    gamers: [
      {
        grid: [
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // One non-zero cell -> game over
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
      },
    ],
  })),
};

// Mock Logger and gameService
vi.mock("../../core/utils/Logger", () => ({
  getLogger: () => loggerMock,
}));

vi.mock("../../core/socket/websocket", () => {
  const emitMock = vi.fn();
  const toMock = vi.fn(() => ({ emit: emitMock }));
  const getInstanceMock = vi.fn(() => ({ to: toMock }));

  return {
    default: {
      getInstance: getInstanceMock,
    },
    __mocked: {
      emitMock,
      toMock,
      getInstanceMock,
    },
  };
});

vi.mock("../../core/game/GameService", () => ({
  gameService: {
    getGame: vi.fn(() => mockGame),
    sendGameState: vi.fn(),
  },
}));

describe("TetrisGameLoop", () => {
  let loop: TetrisGameLoop;

  beforeEach(() => {
    loop = new TetrisGameLoop({}, "test-room");
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    loop.stop();
    vi.useRealTimers();
  });

  it("should start the game loop with two timers", () => {
    loop.start();
    expect(loggerMock.info).toHaveBeenCalledWith(
      "Starting game loop for room test-room",
    );

    vi.advanceTimersByTime(100);
    expect(mockGame.processPlayerInputsOnly).toHaveBeenCalled();
    expect(mockGame.processGravity).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    expect(mockGame.processGravity).toHaveBeenCalled();
  });

  it("should not start loop if already running", () => {
    loop.start();
    loop.start(); // second call
    expect(loggerMock.warn).toHaveBeenCalledWith("Game test-room already started");
  });

  it("should stop the game loop and clear timers", () => {
    loop.start();
    loop.stop();
    expect(loggerMock.info).toHaveBeenCalledWith("Game loop stopped for room test-room");
  });

  it("should stop loop if game is not running during input processing", () => {
    (gameService.getGame as any).mockReturnValueOnce({ isRunning: false });

    loop.start();
    vi.advanceTimersByTime(100);
    expect(loggerMock.info).toHaveBeenCalledWith(
      "Game test-room not running — stopping loop",
    );
  });

  it("should call gameService.sendGameState during intervals", () => {
    loop.start();
    vi.advanceTimersByTime(100);
    expect(gameService.sendGameState).toHaveBeenCalled();
  });

  it("should stop and log game over if any player has filled grid", () => {
    loop.updateGame();
    expect(mockGame.processPlayerActions).toHaveBeenCalled();
    expect(mockGame.stop).toHaveBeenCalled();
    expect(loggerMock.info).toHaveBeenCalledWith(
      "Game over detected in room test-room",
    );
  });

  it("should stop if game is not running in updateGame", () => {
    (gameService.getGame as any).mockReturnValueOnce({ isRunning: false });

    const localLoop = new TetrisGameLoop({}, "test-room");
    localLoop.updateGame();

    expect(loggerMock.info).not.toHaveBeenCalledWith(
      "Game over detected in room test-room",
    );
  });
});
