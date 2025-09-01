import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../../test/test-utils";
import Solo from "../Solo";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Solo", () => {
  it("renders solo game interface", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        score: 0,
        linesCleared: 0,
        board: [],
        currentPiece: null,
        nextPieces: [],
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

    render(<Solo />, { preloadedState: mockState });

    expect(screen.getByText("Solo Tetris")).toBeInTheDocument();
    expect(screen.getByText("Press SPACE to start!")).toBeInTheDocument();
    expect(screen.getByText("Start Game")).toBeInTheDocument();
  });

  it("starts game when button is clicked", () => {
    const mockState = {
      game: {
        status: "idle" as const,
        score: 0,
        linesCleared: 0,
        board: [],
        currentPiece: null,
        nextPieces: [],
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

    const { store } = render(<Solo />, { preloadedState: mockState });

    const startButton = screen.getByText("Start Game");
    fireEvent.click(startButton);

    const state = store.getState();
    expect(state.game.status).toBe("playing");
  });
});
