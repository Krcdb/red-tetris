import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../test/test-utils";
import GameControls from "../GameControls";

// Use vi.hoisted to properly hoist the mock functions
const { mockSendInput, mockPlayerReady } = vi.hoisted(() => ({
  mockSendInput: vi.fn(),
  mockPlayerReady: vi.fn(),
}));

// Mock the socket service
vi.mock("../../services/socketService", () => ({
  socketService: {
    sendInput: mockSendInput,
    playerReady: mockPlayerReady,
  },
}));

describe("GameControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders controls instructions", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    expect(screen.getByText("Controls:")).toBeInTheDocument();
    expect(screen.getByText("← → : Move left/right")).toBeInTheDocument();
    expect(screen.getByText("Ready to Play")).toBeInTheDocument();
  });

  it("shows ready button when game is idle", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    expect(screen.getByText("Ready to Play")).toBeInTheDocument();
  });

  it("calls playerReady when ready button is clicked", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    const readyButton = screen.getByText("Ready to Play");
    fireEvent.click(readyButton);

    expect(mockPlayerReady).toHaveBeenCalledTimes(1);
  });

  it("handles left arrow key when game is playing", () => {
    const mockState = {
      game: {
        status: "playing" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    fireEvent.keyDown(document, { code: "ArrowLeft" });
    expect(mockSendInput).toHaveBeenCalledWith({
      up: false,
      left: true,
      right: false,
      down: false,
      space: false,
    });
  });

  it("handles right arrow key when game is playing", () => {
    const mockState = {
      game: {
        status: "playing" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    fireEvent.keyDown(document, { code: "ArrowRight" });
    expect(mockSendInput).toHaveBeenCalledWith({
      up: false,
      left: false,
      right: true,
      down: false,
      space: false,
    });
  });

  it("handles down arrow key when game is playing", () => {
    const mockState = {
      game: {
        status: "playing" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    fireEvent.keyDown(document, { code: "ArrowDown" });
    expect(mockSendInput).toHaveBeenCalledWith({
      up: false,
      left: false,
      right: false,
      down: true,
      space: false,
    });
  });

  it("handles up arrow key when game is playing", () => {
    const mockState = {
      game: {
        status: "playing" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    fireEvent.keyDown(document, { code: "ArrowUp" });
    expect(mockSendInput).toHaveBeenCalledWith({
      up: true,
      left: false,
      right: false,
      down: false,
      space: false,
    });
  });

  it("handles space key when game is playing", () => {
    const mockState = {
      game: {
        status: "playing" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    fireEvent.keyDown(document, { code: "Space" });
    expect(mockSendInput).toHaveBeenCalledWith({
      up: false,
      left: false,
      right: false,
      down: false,
      space: true,
    });
  });

  it("handles keyboard key up events when game is playing", () => {
    const mockState = {
      game: {
        status: "playing" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    // First press a key down
    fireEvent.keyDown(document, { code: "ArrowLeft" });

    // Then release it
    fireEvent.keyUp(document, { code: "ArrowLeft" });

    // Should send input with left set to false
    expect(mockSendInput).toHaveBeenLastCalledWith({
      up: false,
      left: false,
      right: false,
      down: false,
      space: false,
    });
  });

  it("ignores repeated key presses", () => {
    const mockState = {
      game: {
        status: "playing" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    // Press the same key multiple times
    fireEvent.keyDown(document, { code: "ArrowLeft" });
    fireEvent.keyDown(document, { code: "ArrowLeft" });
    fireEvent.keyDown(document, { code: "ArrowLeft" });

    // Should only call sendInput once (not for repeated presses)
    expect(mockSendInput).toHaveBeenCalledTimes(1);
  });

  it("does not handle keyboard input when game is not playing", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    // Try to press keys when game is not playing
    fireEvent.keyDown(document, { code: "ArrowLeft" });
    fireEvent.keyDown(document, { code: "ArrowRight" });
    fireEvent.keyDown(document, { code: "Space" });

    // Should not call sendInput at all
    expect(mockSendInput).not.toHaveBeenCalled();
  });

  it("shows playing status when game is active", () => {
    const mockState = {
      game: {
        status: "playing" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    expect(screen.getByText("Status: PLAYING")).toBeInTheDocument();
  });

  it("shows paused status when game is paused", () => {
    const mockState = {
      game: {
        status: "paused" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    expect(screen.getByText("Status: PAUSED")).toBeInTheDocument();
  });

  it("shows game over status when game is over", () => {
    const mockState = {
      game: {
        status: "gameOver" as const,
        board: [],
        currentPiece: null,
        nextPieces: [],
        score: 0,
        linesCleared: 0,
        level: 1,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameControls />, { preloadedState: mockState });

    expect(screen.getByText("Status: GAMEOVER")).toBeInTheDocument();
  });
});
