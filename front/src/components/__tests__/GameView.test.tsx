import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../test/test-utils";
import GameView from "../GameView";

const { mockNavigate, mockSocketService } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSocketService: {
    playerReady: vi.fn(),
    resetForHome: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../services/socketService", () => ({
  socketService: mockSocketService,
}));

vi.mock("../GameBoard", () => ({
  default: () => <div data-testid="game-board-stub" />,
}));

vi.mock("../GameInfo", () => ({
  default: () => <div data-testid="game-info-stub" />,
}));

vi.mock("../GameControls", () => ({
  default: () => <div data-testid="game-controls-stub" />,
}));

const baseGameState = {
  board: [],
  currentPiece: null,
  nextPieces: [],
  score: 0,
  linesCleared: 0,
  level: 1,
  status: "playing" as const,
  gameMode: "multiplayer" as const,
  room: "myroom",
  playerName: "alice",
  opponents: [],
  isLoading: false,
  error: null,
  needsNextPiece: false,
  gamers: [],
};

describe("GameView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders GameBoard, GameInfo and GameControls while playing", () => {
    render(<GameView />, { preloadedState: { game: baseGameState } });
    expect(screen.getByTestId("game-board-stub")).toBeInTheDocument();
    expect(screen.getByTestId("game-info-stub")).toBeInTheDocument();
    expect(screen.getByTestId("game-controls-stub")).toBeInTheDocument();
    expect(screen.getByText("Red Tetris - myroom")).toBeInTheDocument();
    expect(screen.getByText("Player: alice")).toBeInTheDocument();
  });

  it("renders the idle waiting screen when status is idle", () => {
    render(<GameView />, {
      preloadedState: { game: { ...baseGameState, status: "idle" } },
    });
    expect(screen.getByText("Waiting for game to start...")).toBeInTheDocument();
    expect(screen.queryByTestId("game-board-stub")).not.toBeInTheDocument();
  });

  it("renders the error screen when game has an error", () => {
    render(<GameView />, {
      preloadedState: { game: { ...baseGameState, error: "boom" } },
    });
    expect(screen.getByText("Game Error")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("dispatches resetGame when Back to Lobby is clicked from error screen", () => {
    const { store } = render(<GameView />, {
      preloadedState: { game: { ...baseGameState, error: "boom" } },
    });
    fireEvent.click(screen.getByText("Back to Lobby"));
    expect(store.getState().game.status).toBe("idle");
    expect(store.getState().game.error).toBeNull();
  });

  it("renders GameOverModal when status is gameOver and supports return-to-lobby", () => {
    const { store } = render(<GameView />, {
      preloadedState: {
        game: {
          ...baseGameState,
          status: "gameOver",
          score: 1234,
          linesCleared: 7,
        },
      },
    });
    expect(screen.getByRole("dialog", { name: "Game Over" })).toBeInTheDocument();
    expect(screen.getByText("Score: 1234")).toBeInTheDocument();
    expect(screen.getByText("Lines: 7")).toBeInTheDocument();

    fireEvent.click(screen.getByText("🔄 Return to Lobby (Same Mode)"));
    expect(store.getState().game.status).toBe("idle");
    // Identity preserved by resetGame
    expect(store.getState().game.playerName).toBe("alice");
    expect(store.getState().game.room).toBe("myroom");
  });

  it("handles Exit to Home from the game-over modal", () => {
    render(<GameView />, {
      preloadedState: { game: { ...baseGameState, status: "gameOver" } },
    });
    fireEvent.click(screen.getByText("🏠 Exit to Home (Change Mode)"));
    expect(mockSocketService.resetForHome).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("calls socketService.playerReady shortly after mount", () => {
    vi.useFakeTimers();
    try {
      render(<GameView />, { preloadedState: { game: baseGameState } });
      vi.advanceTimersByTime(250);
      expect(mockSocketService.playerReady).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
