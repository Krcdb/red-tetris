import { createServer, Server } from "http";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { matchService } from "../../core/match/MatchService.js";
import MyWebSocket from "../../core/socket/websocket.js";
import { matchTest } from "../data.js";

describe("MatchService", () => {
  let clientSocket: ClientSocket, httpServer: Server, wsServer: MyWebSocket;
  let port: number;

  const socketFactory = () => ({
    data: {} as Record<string, any>,
    leave: vi.fn(),
  });

  beforeAll(async () => {
    httpServer = createServer();
    wsServer = MyWebSocket.getInstance(httpServer);

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    port = (httpServer.address() as any).port;

    clientSocket = Client(`http://localhost:${port}`);

    await new Promise<void>((resolve, reject) => {
      clientSocket.on("connect", () => {
        resolve();
      });
      clientSocket.on("connect_error", reject);
    });
  });

  beforeEach(() => {
    matchService.matchs = {};
    vi.clearAllMocks();
  });

  it("should create a new room when a player joins", () => {
    const socket = socketFactory();
    matchService.playerJoin("Alice", "room1", socket as any);

    expect(matchService.matchs.room1).toBeDefined();
    expect(matchService.matchs.room1.player).toHaveLength(1);
    expect(socket.data.currentRoom).toBe("room1");
    expect(socket.data.playerName).toBe("Alice");
  });

  it("should make the player switch room", () => {
    const socket = socketFactory();
    socket.data.currentRoom = "room2";
    socket.data.playerName = "Alice";

    matchService.matchs.room2 = matchTest;
    matchService.playerJoin("Alice", "room1", socket as any);

    expect(matchService.matchs.room1).toBeDefined();
    expect(matchService.matchs.room2).toBeUndefined();
    expect(matchService.matchs.room1.player).toHaveLength(1);
    expect(socket.data.currentRoom).toBe("room1");
    expect(socket.data.playerName).toBe("Alice");
    expect(socket.leave).toHaveBeenCalledTimes(1);
  });

  it("should not add the same player twice", () => {
    const socket1 = socketFactory();
    matchService.playerJoin("Alice", "room1", socket1 as any);

    const socket2 = socketFactory();
    expect(() => {
      matchService.playerJoin("Alice", "room1", socket2 as any);
    }).toThrowError("Name already taken");

    expect(matchService.matchs.room1.player).toHaveLength(1);
  });

  it("should allow multiple players in a room", () => {
    const socket1 = socketFactory();
    matchService.playerJoin("Alice", "room1", socket1 as any);

    const socket2 = socketFactory();
    matchService.playerJoin("Bob", "room1", socket2 as any);

    expect(matchService.matchs.room1.player).toHaveLength(2);
  });

  it("should remove a player and delete room if empty", () => {
    const socket = socketFactory();
    matchService.playerJoin("Alice", "room1", socket as any);
    matchService.playerLeave("Alice", "room1", socket as any);

    expect(matchService.matchs.room1).toBeUndefined();
  });

  it("should warn if room does not exist", () => {
    const socket = socketFactory();
    matchService.playerLeave("Alice", "roomX", socket as any);
  });

  it("should warn if player not in room", () => {
    const socket1 = socketFactory();
    const socket2 = socketFactory();

    matchService.playerJoin("Bob", "room1", socket1 as any);
    matchService.playerLeave("Alice", "room1", socket2 as any);

    expect(matchService.matchs.room1.player).toHaveLength(1);
  });
});
