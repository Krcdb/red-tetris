import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registerGameHandler } from "../../core/game/game.events.js";
import { gameService } from "../../core/game/GameService.js";
import { ClientToServerEvents, CustomeSocket } from "../../core/types/socket-event.js";

describe("registerGameHandler", () => {
  let socket: Partial<CustomeSocket> & {
    on: <E extends keyof ClientToServerEvents>(event: E, listener: (...args: Parameters<ClientToServerEvents[E]>) => void) => CustomeSocket;
  };
  let onHandlers: Record<string, Function>;

  beforeEach(() => {
    onHandlers = {};
    socket = {
      data: {},
      id: "test-socket-id",
      on: vi.fn((event, cb) => {
        onHandlers[event] = cb;
        return socket as CustomeSocket;
      }),
    };

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
    socket.data = { currentRoom: "room1", playerName: "bob" };
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
    socket.data = { currentRoom: "room2", playerName: "alice" };
    const input = { down: false, up: true };
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
