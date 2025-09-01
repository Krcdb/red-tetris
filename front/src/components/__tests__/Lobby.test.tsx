import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test/test-utils";
import Lobby from "../Lobby";

// Mock useSocket hook
vi.mock("../../hooks/useSocket", () => ({
  useSocket: () => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ room: "testroom", playerName: "testplayer" }),
    useNavigate: () => vi.fn(),
  };
});

describe("Lobby", () => {
  it("renders lobby information", () => {
    render(<Lobby />);

    expect(screen.getByText("Room: testroom")).toBeInTheDocument();
  });
});
