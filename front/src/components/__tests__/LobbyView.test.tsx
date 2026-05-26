import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../test/test-utils";
import LobbyView from "../LobbyView";

const { mockNavigate, mockSocketService } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSocketService: {
    startGame: vi.fn(),
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

const baseLobby = {
  players: [
    { name: "alice", isLeader: true },
    { name: "bob", isLeader: false },
  ],
  room: "myroom",
  playerName: "alice",
  canStart: true,
  isLoading: false,
  error: null,
};

describe("LobbyView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders room name, player list and leader/you markers", () => {
    render(<LobbyView />, { preloadedState: { lobby: baseLobby } });
    expect(screen.getByText("Lobby: myroom")).toBeInTheDocument();
    expect(screen.getByText("You are: alice")).toBeInTheDocument();
    expect(screen.getByText(/\(you\)/)).toBeInTheDocument();
    expect(screen.getByText(/\(leader\)/)).toBeInTheDocument();
    expect(screen.getByText("Players in room (2):")).toBeInTheDocument();
    // bob is in the list but is not the leader and not "you"
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("enables Start Game and calls socketService.startGame when leader clicks", () => {
    render(<LobbyView />, { preloadedState: { lobby: baseLobby } });
    const button = screen.getByText("Start Game");
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(mockSocketService.startGame).toHaveBeenCalledWith("myroom");
  });

  it("disables the start button and shows waiting label when canStart is false", () => {
    render(<LobbyView />, {
      preloadedState: {
        lobby: { ...baseLobby, canStart: false, playerName: "bob" },
      },
    });
    const button = screen.getByText("Waiting for leader...");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockSocketService.startGame).not.toHaveBeenCalled();
  });

  it("disables the start button while loading even if leader", () => {
    render(<LobbyView />, {
      preloadedState: { lobby: { ...baseLobby, isLoading: true } },
    });
    expect(screen.getByText("Start Game")).toBeDisabled();
  });

  it("renders the error branch with a Go Home button that navigates", () => {
    render(<LobbyView />, {
      preloadedState: {
        lobby: { ...baseLobby, error: "Name already taken" },
      },
    });
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Name already taken")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Go Home"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("navigates home from the Back to Home button", () => {
    render(<LobbyView />, { preloadedState: { lobby: baseLobby } });
    fireEvent.click(screen.getByText("🏠 Back to Home"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
