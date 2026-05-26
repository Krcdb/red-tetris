import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { render, screen } from "../../test/test-utils";
import GameRoom from "../GameRoom";
import { gameSetup, startGame, gameOver } from "../../redux/gameSlice";

const { mockNavigate, mockUseParams, mockUseSearchParams, mockSocketService } =
  vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockUseParams: vi.fn(),
    mockUseSearchParams: vi.fn(),
    mockSocketService: {
      initialize: vi.fn(),
      joinRoom: vi.fn(),
      socket: {
        on: vi.fn(),
        off: vi.fn(),
      },
    },
  }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../services/socketService", () => ({
  socketService: mockSocketService,
}));

vi.mock("../GameView", () => ({
  default: () => <div data-testid="game-view-stub" />,
}));

vi.mock("../LobbyView", () => ({
  default: () => <div data-testid="lobby-view-stub" />,
}));

describe("GameRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const params = new URLSearchParams("mode=speed");
    mockUseParams.mockReturnValue({ room: "myroom", playerName: "alice" });
    mockUseSearchParams.mockReturnValue([params, vi.fn()]);
  });

  it("renders LobbyView when status is idle", () => {
    render(<GameRoom />);
    expect(screen.getByTestId("lobby-view-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("game-view-stub")).not.toBeInTheDocument();
  });

  it("renders GameView when status is setup", () => {
    const { store } = render(<GameRoom />);
    act(() => {
      store.dispatch(gameSetup());
    });
    expect(screen.getByTestId("game-view-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("lobby-view-stub")).not.toBeInTheDocument();
  });

  it("renders GameView when status is playing", () => {
    const { store } = render(<GameRoom />);
    act(() => {
      store.dispatch(startGame({ gameMode: "multiplayer" }));
    });
    expect(screen.getByTestId("game-view-stub")).toBeInTheDocument();
  });

  it("renders GameView when status is gameOver", () => {
    const { store } = render(<GameRoom />);
    act(() => {
      store.dispatch(gameOver());
    });
    expect(screen.getByTestId("game-view-stub")).toBeInTheDocument();
  });

  it("initializes socketService and joins room on mount with parsed mode", () => {
    render(<GameRoom />);
    expect(mockSocketService.initialize).toHaveBeenCalled();
    expect(mockSocketService.joinRoom).toHaveBeenCalledWith("alice", "myroom", "speed");
  });

  it("dispatches setLobbyConfig and setGameConfig with route params", () => {
    const { store } = render(<GameRoom />);
    const state = store.getState();
    expect(state.lobby.room).toBe("myroom");
    expect(state.lobby.playerName).toBe("alice");
    expect(state.game.room).toBe("myroom");
    expect(state.game.playerName).toBe("alice");
    expect(state.game.gameMode).toBe("multiplayer");
  });

  it("persists the selected game mode to sessionStorage", () => {
    render(<GameRoom />);
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      "selectedGameMode",
      "speed",
    );
  });

  it("falls back to 'normal' when no mode query param is provided", () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
    render(<GameRoom />);
    expect(mockSocketService.joinRoom).toHaveBeenCalledWith("alice", "myroom", "normal");
  });

  it("navigates home when room or playerName is missing", () => {
    mockUseParams.mockReturnValue({ room: undefined, playerName: undefined });
    render(<GameRoom />);
    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(mockSocketService.joinRoom).not.toHaveBeenCalled();
  });

  it("registers and cleans up the game:isSetup listener", () => {
    const { unmount } = render(<GameRoom />);
    expect(mockSocketService.socket.on).toHaveBeenCalledWith(
      "game:isSetup",
      expect.any(Function),
    );
    unmount();
    expect(mockSocketService.socket.off).toHaveBeenCalledWith("game:isSetup");
  });
});
