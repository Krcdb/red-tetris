import { describe, it, expect, vi } from "vitest";
import { render } from "../../test/test-utils";
import GameBoard from "../GameBoard";

describe("GameBoard", () => {
  it("renders the game board component", () => {
    const mockState = {
      game: {
        board: Array(20)
          .fill(null)
          .map(() => Array(10).fill(0)),
        currentPiece: null,
        score: 0,
        linesCleared: 0,
        level: 1,
        status: "idle" as const,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        nextPieces: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameBoard />, { preloadedState: mockState });

    // Check if the game board container exists
    const gameBoard = document.querySelector(".game-board");
    expect(gameBoard).toBeInTheDocument();
  });

  it("renders correct number of cells (200 cells for 20x10 board)", () => {
    const mockState = {
      game: {
        board: Array(20)
          .fill(null)
          .map(() => Array(10).fill(0)),
        currentPiece: null,
        score: 0,
        linesCleared: 0,
        level: 1,
        status: "idle" as const,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        nextPieces: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameBoard />, { preloadedState: mockState });

    // Count all cells with the 'cell' class
    const cells = document.querySelectorAll(".cell");
    expect(cells).toHaveLength(200);
  });

  it("applies correct CSS classes for empty cells", () => {
    const mockState = {
      game: {
        board: Array(20)
          .fill(null)
          .map(() => Array(10).fill(0)),
        currentPiece: null,
        score: 0,
        linesCleared: 0,
        level: 1,
        status: "idle" as const,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        nextPieces: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameBoard />, { preloadedState: mockState });

    // Check first cell
    const cells = document.querySelectorAll(".cell");
    const firstCell = cells[0];
    expect(firstCell).toHaveClass("cell", "empty");
  });

  it("handles invisible game mode correctly", () => {
    // Mock sessionStorage to return 'invisible' mode
    vi.mocked(window.sessionStorage.getItem).mockReturnValue("invisible");

    const boardWithFilledCells = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    boardWithFilledCells[19][0] = 1;

    const mockState = {
      game: {
        board: boardWithFilledCells,
        currentPiece: null,
        score: 0,
        linesCleared: 0,
        level: 1,
        status: "idle" as const,
        gameMode: "solo" as const,
        room: "",
        playerName: "",
        opponents: [],
        nextPieces: [],
        isLoading: false,
        error: null,
        needsNextPiece: false,
        gamers: [],
      },
    };

    render(<GameBoard />, { preloadedState: mockState });

    // In invisible mode, placed pieces should be hidden (have background-color: #111)
    const cells = document.querySelectorAll(".cell");
    const filledCell = cells[190] as HTMLElement;
    expect(filledCell.style.backgroundColor).toBe("rgb(17, 17, 17)"); // #111 in RGB
  });
});
