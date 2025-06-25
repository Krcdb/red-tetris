import { describe, it, vi, beforeEach, expect, afterEach } from "vitest";
import { registerGameHandler } from "../../core/game/game.events";
import { gameService } from "../../core/game/GameService"; // actual import
import { CustomeSocket } from "../../core/types/socket-event";

describe("registerGameHandler", () => {
  let socket: Partial<CustomeSocket>;
  let onHandlers: Record<string, Function>;

  beforeEach(() => {
    onHandlers = {};
    socket = {
      on: vi.fn((event, cb) => {
        onHandlers[event] = cb;
      }),
      data: {},
      id: "test-socket-id",
    };

    // ✅ mock gameService methods directly
    vi.spyOn(gameService, "playerReady").mockImplementation(() => {});
    vi.spyOn(gameService, "playerInputChange").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should register game handler events", () => {
    registerGameHandler(socket as CustomeSocket);
    expect(socket.on).toHaveBeenCalledWith("game:playerReady", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("game:playerInputChanges", expect.any(Function));
  });

  it("should call gameService.playerReady with correct data", () => {
    socket.data = { playerName: "bob", currentRoom: "room1" };
    registerGameHandler(socket as CustomeSocket);
    onHandlers["game:playerReady"]();
    expect(gameService.playerReady).toHaveBeenCalledWith("bob", "room1");
  });

  it("should not call gameService.playerReady if data is missing", () => {
    socket.data = {};
    registerGameHandler(socket as CustomeSocket);
    onHandlers["game:playerReady"]();
    expect(gameService.playerReady).not.toHaveBeenCalled();
  });

  it("should call gameService.playerInputChange with correct data", () => {
    socket.data = { playerName: "alice", currentRoom: "room2" };
    const input = { up: true, down: false };
    registerGameHandler(socket as CustomeSocket);
    onHandlers["game:playerInputChanges"]({ input });
    expect(gameService.playerInputChange).toHaveBeenCalledWith("alice", "room2", input);
  });

  it("should not call gameService.playerInputChange if data is missing", () => {
    socket.data = {};
    registerGameHandler(socket as CustomeSocket);
    onHandlers["game:playerInputChanges"]({ input: { up: false } });
    expect(gameService.playerInputChange).not.toHaveBeenCalled();
  });
});
