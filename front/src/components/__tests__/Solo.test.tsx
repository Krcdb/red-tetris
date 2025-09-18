import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../test/test-utils";
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

// Mock socketService
vi.mock("../../services/socketService", () => ({
	socketService: {
		initialize: vi.fn(),
		joinRoom: vi.fn(),
		resetForHome: vi.fn(),
		cleanup: vi.fn(),
		socket: {
			on: vi.fn(),
			off: vi.fn(),
		},
	},
}));

describe("Solo", () => {
	it("renders solo game loading state", () => {
		const mockState = {
			game: {
				status: "idle" as const,
				score: 0,
				linesCleared: 0,
				error: null,
				board: [],
				currentPiece: null,
				nextPieces: [],
				level: 1,
				gameMode: "solo" as const,
				room: "",
				playerName: "",
				opponents: [],
				isLoading: false,
				needsNextPiece: false,
				gamers: [],
			},
		};

		render(<Solo />, { preloadedState: mockState });

		expect(screen.getByText("Solo Tetris")).toBeInTheDocument();
		expect(screen.getByText("Setting up game...")).toBeInTheDocument();
		expect(screen.getByText("⏳")).toBeInTheDocument();
	});
});
