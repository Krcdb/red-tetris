import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../test/test-utils";
import GameOverModal from "../GameOverModal";

describe("GameOverModal", () => {
  const mockOnExit = vi.fn();
  const mockOnReturnToLobby = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders game over information", () => {
    render(<GameOverModal score={1000} lines={10} onExit={mockOnExit} />);

    expect(screen.getByText("🕹️ Game Over")).toBeInTheDocument();
    expect(screen.getByText("Score: 1000")).toBeInTheDocument();
    expect(screen.getByText("Lines: 10")).toBeInTheDocument();
  });

  it("calls onExit when exit button is clicked", () => {
    render(<GameOverModal score={1000} lines={10} onExit={mockOnExit} />);

    const exitButton = screen.getByText("🏠 Exit to Home (Change Mode)");
    fireEvent.click(exitButton);

    expect(mockOnExit).toHaveBeenCalledTimes(1);
  });

  it("shows return to lobby button in multiplayer mode", () => {
    render(
      <GameOverModal
        score={1000}
        lines={10}
        isMultiplayer={true}
        onExit={mockOnExit}
        onReturnToLobby={mockOnReturnToLobby}
      />
    );

    expect(screen.getByText("🔄 Return to Lobby (Same Mode)")).toBeInTheDocument();
  });
});
