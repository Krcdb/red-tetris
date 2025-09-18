import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "../../test/test-utils";
import LobbyRoute from "../LobbyRoute";

// Use vi.hoisted to properly hoist the mock variables
const { mockNavigate, mockSocketService } = vi.hoisted(() => ({
	mockNavigate: vi.fn(),
	mockSocketService: {
		initialize: vi.fn(),
		joinRoom: vi.fn(),
		startGame: vi.fn(),
		socket: {
			on: vi.fn(),
			off: vi.fn(),
		},
	},
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useParams: () => ({ room: "testroom", playerName: "testplayer" }),
		useSearchParams: () => [new URLSearchParams("mode=normal")],
		useNavigate: () => mockNavigate,
	};
});

// Mock socketService
vi.mock("../../services/socketService", () => ({
	socketService: mockSocketService,
}));

describe("LobbyRoute", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders lobby information", () => {
		const mockState = {
			lobby: {
				players: [
					{ name: "testplayer", isLeader: true },
					{ name: "player2", isLeader: false },
				],
				canStart: true,
				isLoading: false,
				error: null,
				room: "testroom",
				playerName: "testplayer",
			},
		};

		render(<LobbyRoute />, { preloadedState: mockState });

		expect(screen.getByText("Lobby: testroom")).toBeInTheDocument();
		expect(screen.getByText("You are: testplayer")).toBeInTheDocument();
		expect(screen.getByText("Players in room (2):")).toBeInTheDocument();
	});

	it("calls startGame when start button is clicked", () => {
		const mockState = {
			lobby: {
				players: [
					{ name: "testplayer", isLeader: true },
					{ name: "player2", isLeader: false },
				],
				canStart: true,
				isLoading: false,
				error: null,
				room: "testroom",
				playerName: "testplayer",
			},
		};

		render(<LobbyRoute />, { preloadedState: mockState });

		const startButton = screen.getByText("Start Game");
		fireEvent.click(startButton);

		expect(mockSocketService.startGame).toHaveBeenCalledWith("testroom");
	});

	it("shows waiting state when cannot start", () => {
		const mockState = {
			lobby: {
				players: [
					{ name: "player2", isLeader: true },
					{ name: "testplayer", isLeader: false },
				],
				canStart: false,
				isLoading: false,
				error: null,
				room: "testroom",
				playerName: "testplayer",
			},
		};

		render(<LobbyRoute />, { preloadedState: mockState });

		expect(screen.getByText("Waiting for leader...")).toBeInTheDocument();
	});

	it("renders error state when there is an error", () => {
		const mockState = {
			lobby: {
				players: [],
				canStart: false,
				isLoading: false,
				error: "Connection failed",
				room: "testroom",
				playerName: "testplayer",
			},
		};

		render(<LobbyRoute />, { preloadedState: mockState });

		expect(screen.getByText("Error")).toBeInTheDocument();
		expect(screen.getByText("Connection failed")).toBeInTheDocument();
	});

	it("navigates home when error go home button is clicked", () => {
		const mockState = {
			lobby: {
				players: [],
				canStart: false,
				isLoading: false,
				error: "Connection failed",
				room: "testroom",
				playerName: "testplayer",
			},
		};

		render(<LobbyRoute />, { preloadedState: mockState });

		const goHomeButton = screen.getByText("Go Home");
		fireEvent.click(goHomeButton);

		expect(mockNavigate).toHaveBeenCalledWith("/");
	});

	it("navigates home when back to home button is clicked", () => {
		const mockState = {
			lobby: {
				players: [
					{ name: "testplayer", isLeader: true },
					{ name: "player2", isLeader: false },
				],
				canStart: true,
				isLoading: false,
				error: null,
				room: "testroom",
				playerName: "testplayer",
			},
		};

		render(<LobbyRoute />, { preloadedState: mockState });

		const backHomeButton = screen.getByText("🏠 Back to Home");
		fireEvent.click(backHomeButton);

		expect(mockNavigate).toHaveBeenCalledWith("/");
	});

	it("calls socketService methods on mount", () => {
		const mockState = {
			lobby: {
				players: [],
				canStart: false,
				isLoading: false,
				error: null,
				room: "testroom",
				playerName: "testplayer",
			},
		};

		render(<LobbyRoute />, { preloadedState: mockState });

		expect(mockSocketService.initialize).toHaveBeenCalled();
		expect(mockSocketService.joinRoom).toHaveBeenCalledWith(
			"testplayer",
			"testroom",
			"normal",
		);
		expect(mockSocketService.socket.on).toHaveBeenCalledWith(
			"game:isSetup",
			expect.any(Function),
		);
	});

	it("disables start button when cannot start", () => {
		const mockState = {
			lobby: {
				players: [{ name: "player2", isLeader: true }],
				canStart: false,
				isLoading: false,
				error: null,
				room: "testroom",
				playerName: "testplayer",
			},
		};

		render(<LobbyRoute />, { preloadedState: mockState });

		const button = screen.getByText(
			"Waiting for leader...",
		) as HTMLButtonElement;
		expect(button.disabled).toBe(true);
	});

	it("displays player list with leader indication", () => {
		const mockState = {
			lobby: {
				players: [
					{ name: "testplayer", isLeader: true },
					{ name: "player2", isLeader: false },
					{ name: "player3", isLeader: false },
				],
				canStart: true,
				isLoading: false,
				error: null,
				room: "testroom",
				playerName: "testplayer",
			},
		};

		render(<LobbyRoute />, { preloadedState: mockState });

		expect(screen.getByText("testplayer (you) (leader)")).toBeInTheDocument();
		expect(screen.getByText("player2")).toBeInTheDocument();
		expect(screen.getByText("player3")).toBeInTheDocument();
	});
});
