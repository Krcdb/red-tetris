import { describe, it, expect } from "vitest";
import gameReducer, {
  updateGameState,
  setGameConfig,
  gameOver,
  gameSetup,
  resetGame,
  initialState,
} from "../gameSlice";

describe("gameSlice", () => {
  it("should handle initial state", () => {
    const result = gameReducer(undefined, { type: "unknown" });
    expect(result).toEqual(initialState);
  });

  it("should handle gameOver", () => {
    const actual = gameReducer(initialState, gameOver());
    expect(actual.status).toBe("gameOver");
  });

  it("should handle gameSetup", () => {
    const actual = gameReducer(initialState, gameSetup());
    expect(actual.status).toBe("idle");
    expect(actual.isLoading).toBe(false);
    expect(actual.error).toBe(null);
  });

  it("should handle setGameConfig", () => {
    const config = {
      room: "test-room",
      playerName: "TestPlayer",
      gameMode: "multiplayer" as const,
    };

    const actual = gameReducer(initialState, setGameConfig(config));
    expect(actual.room).toBe("test-room");
    expect(actual.playerName).toBe("TestPlayer");
    expect(actual.gameMode).toBe("multiplayer");
  });

  it("should handle resetGame", () => {
    const modifiedState = {
      ...initialState,
      score: 1000,
      status: "gameOver" as const,
      room: "test-room",
      playerName: "TestPlayer",
    };

    const actual = gameReducer(modifiedState, resetGame());
    expect(actual).toEqual(initialState);
  });

  it("should handle updateGameState", () => {
    const gameState = {
      currentPieceIndex: 5,
      gamers: [
        {
          name: "TestPlayer",
          score: 500,
          linesCleared: 10,
          grid: Array(20)
            .fill(null)
            .map(() => Array(10).fill(0)),
          currentPiece: null,
        },
      ],
      isRunning: true,
      isSolo: false,
      room: "test-room",
      nextPieces: [],
    };

    // First set up a state with the correct playerName
    const stateWithPlayer = gameReducer(
      initialState,
      setGameConfig({
        room: "test-room",
        playerName: "TestPlayer",
        gameMode: "multiplayer",
      })
    );

    const actual = gameReducer(stateWithPlayer, updateGameState(gameState));

    expect(actual.gamers).toHaveLength(1);
    expect(actual.status).toBe("playing");
    expect(actual.score).toBe(500);
    expect(actual.linesCleared).toBe(10);
  });
});
