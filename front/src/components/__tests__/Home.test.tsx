import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../test/test-utils";
import Home from "../Home";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders home form", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText("Room name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByText("Join / Create Game")).toBeInTheDocument();
  });

  it("handles form submission", () => {
    render(<Home />);

    const roomInput = screen.getByPlaceholderText("Room name");
    const nameInput = screen.getByPlaceholderText("Your name");
    const submitButton = screen.getByText("Join / Create Game");

    fireEvent.change(roomInput, { target: { value: "testroom" } });
    fireEvent.change(nameInput, { target: { value: "testplayer" } });
    fireEvent.click(submitButton);

    expect(mockNavigate).toHaveBeenCalledWith("/testroom/testplayer?mode=normal");
  });

  it("allows game mode selection", () => {
    render(<Home />);

    const speedModeOption = screen.getByText("Speed");
    fireEvent.click(speedModeOption);

    const roomInput = screen.getByPlaceholderText("Room name");
    const nameInput = screen.getByPlaceholderText("Your name");
    const submitButton = screen.getByText("Join / Create Game");

    fireEvent.change(roomInput, { target: { value: "testroom" } });
    fireEvent.change(nameInput, { target: { value: "testplayer" } });
    fireEvent.click(submitButton);

    expect(mockNavigate).toHaveBeenCalledWith("/testroom/testplayer?mode=speed");
  });
});
