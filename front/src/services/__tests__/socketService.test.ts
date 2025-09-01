import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the utils/socket module BEFORE importing socketService
vi.mock("../../utils/socket", () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    id: "test-socket-id",
    onAny: vi.fn(),
    offAny: vi.fn(),
  };

  return {
    default: mockSocket,
  };
});

// Now import after mocking
import { socketService } from "../socketService";
import socket from "../../utils/socket";

describe("socketService", () => {
  let mockSocket: typeof socket;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = socket;
  });

  it("should emit join room event", () => {
    socketService.joinRoom("testPlayer", "testRoom", "normal");

    expect(mockSocket.emit).toHaveBeenCalledWith("match:playerJoin", {
      playerName: "testPlayer",
      room: "testRoom",
      gameMode: "normal",
    });
  });

  it("should emit player ready event", () => {
    socketService.playerReady();

    expect(mockSocket.emit).toHaveBeenCalledWith("game:playerReady");
  });

  it("should emit start game event", () => {
    socketService.startGame("testRoom");

    expect(mockSocket.emit).toHaveBeenCalledWith("match:startGame", {
      room: "testRoom",
    });
  });

  it("should register and unregister event handlers", () => {
    const callback = vi.fn();

    socketService.on("test:event", callback);
    expect(mockSocket.on).toHaveBeenCalledWith("test:event", callback);

    socketService.off("test:event", callback);
    expect(mockSocket.off).toHaveBeenCalledWith("test:event", callback);
  });

  it("should disconnect socket", () => {
    socketService.disconnect();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it("should return socket instance", () => {
    const socketInstance = socketService.socket;
    expect(socketInstance).toBeDefined();
  });

  describe("socketService additional methods", () => {
    it("should handle initialization", () => {
      socketService.initialize();
      expect(mockSocket.on).toHaveBeenCalledWith("game:isSetup", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("game:newState", expect.any(Function));
    });

    it("should handle cleanup", () => {
      socketService.cleanup();
      expect(mockSocket.off).toHaveBeenCalled();
    });

    it("should handle leave room", () => {
      socketService.leaveRoom("testPlayer", "testRoom");
      expect(mockSocket.emit).toHaveBeenCalledWith("match:playerLeft", {
        playerName: "testPlayer",
        room: "testRoom",
      });
    });

    it("should send input", () => {
      const input = { up: true, down: false, left: false, right: false, space: false };
      socketService.sendInput(input);
      expect(mockSocket.emit).toHaveBeenCalledWith("game:playerInputChanges", { input });
    });
  });
});
