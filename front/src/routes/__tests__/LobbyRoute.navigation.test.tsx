import { describe, it, expect, vi } from "vitest";
import { render } from "../../test/test-utils";
import LobbyRoute from "../LobbyRoute";

const mockNavigate = vi.fn();

// Mock react-router-dom with missing params
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ room: undefined, playerName: undefined }),
    useSearchParams: () => [new URLSearchParams()],
    useNavigate: () => mockNavigate,
  };
});

// Mock socketService
vi.mock("../../services/socketService", () => ({
  socketService: {
    initialize: vi.fn(),
    joinRoom: vi.fn(),
    socket: { on: vi.fn(), off: vi.fn() },
  },
}));

describe("LobbyRoute Navigation", () => {
  it("navigates to home when room or playerName is missing", () => {
    const mockState = {
      lobby: {
        players: [],
        canStart: false,
        isLoading: false,
        error: null,
        room: "",
        playerName: "",
      },
    };

    render(<LobbyRoute />, { preloadedState: mockState });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
