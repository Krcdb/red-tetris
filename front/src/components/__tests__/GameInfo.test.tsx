import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/test-utils";
import GameInfo from "../GameInfo";

describe("GameInfo", () => {
  it("renders player stats", () => {
    const mockState = {
      game: {
        playerName: "TestPlayer",
        score: 1000,
        linesCleared: 10,
        level: 2,
        status: "playing" as const,
        gamers: [],
        opponents: [],
        // ...other required properties
      },
    };

    render(<GameInfo />, { preloadedState: mockState });

    expect(screen.getByText("Your Stats")).toBeInTheDocument();
    expect(screen.getByText("Score: 1,000")).toBeInTheDocument();
    expect(screen.getByText("Lines: 10")).toBeInTheDocument();
    expect(screen.getByText("Level: 2")).toBeInTheDocument();
  });

  it("renders opponents section", () => {
    const mockState = {
      game: {
        playerName: "TestPlayer",
        score: 1000,
        linesCleared: 10,
        level: 2,
        status: "playing" as const,
        gamers: [],
        opponents: [
          {
            name: "Opponent1",
            score: 500,
            linesCleared: 5,
            spectrum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 20],
          },
        ],
        // ...other required properties
      },
    };

    render(<GameInfo />, { preloadedState: mockState });

    expect(screen.getByText("Opponents")).toBeInTheDocument();
    expect(screen.getByText("Opponent1")).toBeInTheDocument();
    // Spectrum view (subject §V.1): 10 column bars, not a full mirror grid.
    expect(screen.getByLabelText("Opponent1 spectrum")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Opponent1 spectrum").querySelectorAll(".spectrum-column"),
    ).toHaveLength(10);
  });
});
