import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "../../test/test-utils";
import Solo from "../Solo";
import { setError } from "../../redux/gameSlice";

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
  it("renders the setup/loading view while waiting for the backend", () => {
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
    expect(screen.getByText("Setting up game...")).toBeInTheDocument();
  });

  it("renders an error view with a Back to Home button when an error is set", () => {
    // Solo.tsx dispatches resetGame() on mount, which clears any preloaded
    // error. Set the error AFTER the component mounts so it survives.
    const { store } = render(<Solo />);

    act(() => {
      store.dispatch(setError("Something went wrong"));
    });

    expect(screen.getByText("Solo Game Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    const backButton = screen.getByText("Back to Home");
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
