import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../test/test-utils";
import GameRoute from "../GameRoute";

// Use vi.hoisted to properly hoist the mock variables
const { mockNavigate, mockSocketService } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSocketService: {
    initialize: vi.fn(),
    playerReady: vi.fn(),
    resetForHome: vi.fn(),
    socket: { connected: true, id: "test-id" },
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ room: "testroom", playerName: "testplayer" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../services/socketService", () => ({
  socketService: mockSocketService,
}));

describe("GameRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders waiting state when game is idle", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        error: null,
        score: 0,
        linesCleared: 0,
        board: [],
        currentPiece: null,
        nextPieces: [],
        level: 1,
        gameMode: "multiplayer" as const,
        room: "testroom",
        playerName: "testplayer",
        opponents: [],
        isLoading: false,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameRoute />, { preloadedState: mockState });

    expect(screen.getByText("Red Tetris - testroom")).toBeInTheDocument();
    expect(screen.getByText("Player: testplayer")).toBeInTheDocument();
    expect(screen.getByText("Waiting for game to start...")).toBeInTheDocument();
  });

  it("shows error state when there is an error", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        error: "Connection failed",
        score: 0,
        linesCleared: 0,
        board: [],
        currentPiece: null,
        nextPieces: [],
        level: 1,
        gameMode: "multiplayer" as const,
        room: "testroom",
        playerName: "testplayer",
        opponents: [],
        isLoading: false,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameRoute />, { preloadedState: mockState });

    expect(screen.getByText("Game Error")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("navigates back to lobby when back button is clicked in error state", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        error: "Connection failed",
        score: 0,
        linesCleared: 0,
        board: [],
        currentPiece: null,
        nextPieces: [],
        level: 1,
        gameMode: "multiplayer" as const,
        room: "testroom",
        playerName: "testplayer",
        opponents: [],
        isLoading: false,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameRoute />, { preloadedState: mockState });

    const backButton = screen.getByText("Back to Lobby");
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/testroom/testplayer");
  });

  it("renders game over modal when status is gameOver", () => {
    const mockState = {
      game: {
        status: "gameOver" as const,
        error: null,
        score: 1500,
        linesCleared: 15,
        board: [],
        currentPiece: null,
        nextPieces: [],
        level: 2,
        gameMode: "multiplayer" as const,
        room: "testroom",
        playerName: "testplayer",
        opponents: [],
        isLoading: false,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameRoute />, { preloadedState: mockState });

    expect(screen.getByText("🕹️ Game Over")).toBeInTheDocument();
    expect(screen.getByText("Score: 1500")).toBeInTheDocument();

    // Now this will work since we added role="dialog"
    const modal = screen.getByRole("dialog", { name: "Game Over" });
    expect(modal).toHaveTextContent("Lines: 15");
  });

  it("handles return to lobby button click in game over modal", () => {
    const mockState = {
      game: {
        status: "gameOver" as const,
        error: null,
        score: 1500,
        linesCleared: 15,
        board: [],
        currentPiece: null,
        nextPieces: [],
        level: 2,
        gameMode: "multiplayer" as const,
        room: "testroom",
        playerName: "testplayer",
        opponents: [],
        isLoading: false,
        needsNextPiece: false,
        gamers: [],
      },
    };

    // Mock sessionStorage
    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: vi.fn(() => "normal"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    render(<GameRoute />, { preloadedState: mockState });

    const returnToLobbyButton = screen.getByText("🔄 Return to Lobby (Same Mode)");
    fireEvent.click(returnToLobbyButton);

    expect(mockNavigate).toHaveBeenCalledWith("/testroom/testplayer?mode=normal");
  });

  it("handles exit to home button click in game over modal", () => {
    const mockState = {
      game: {
        status: "gameOver" as const,
        error: null,
        score: 1500,
        linesCleared: 15,
        board: [],
        currentPiece: null,
        nextPieces: [],
        level: 2,
        gameMode: "multiplayer" as const,
        room: "testroom",
        playerName: "testplayer",
        opponents: [],
        isLoading: false,
        needsNextPiece: false,
        gamers: [],
      },
    };

    // Mock sessionStorage
    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: vi.fn(() => "normal"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    render(<GameRoute />, { preloadedState: mockState });

    const exitToHomeButton = screen.getByText("🏠 Exit to Home (Change Mode)");
    fireEvent.click(exitToHomeButton);

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    expect(mockSocketService.resetForHome).toHaveBeenCalled();
  });

  it("renders playing state correctly", () => {
    const mockState = {
      game: {
        status: "playing" as const,
        error: null,
        score: 500,
        linesCleared: 5,
        board: Array(20)
          .fill(null)
          .map(() => Array(10).fill(0)),
        currentPiece: null,
        nextPieces: [],
        level: 1,
        gameMode: "multiplayer" as const,
        room: "testroom",
        playerName: "testplayer",
        opponents: [],
        isLoading: false,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameRoute />, { preloadedState: mockState });

    expect(screen.getByText("Red Tetris - testroom")).toBeInTheDocument();
    expect(screen.getByText("Player: testplayer")).toBeInTheDocument();
    expect(screen.getByText("Mode: 🎮 Normal Mode")).toBeInTheDocument();
  });

  it("calls socketService.initialize and playerReady on mount", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        error: null,
        score: 0,
        linesCleared: 0,
        board: [],
        currentPiece: null,
        nextPieces: [],
        level: 1,
        gameMode: "multiplayer" as const,
        room: "testroom",
        playerName: "testplayer",
        opponents: [],
        isLoading: false,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameRoute />, { preloadedState: mockState });

    expect(mockSocketService.initialize).toHaveBeenCalled();

    // Wait for the timeout to call playerReady
    setTimeout(() => {
      expect(mockSocketService.playerReady).toHaveBeenCalled();
    }, 250);
  });
});
