import { createServer, Server } from "http";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { matchService } from "../../core/match/MatchService.js";
import MyWebSocket from "../../core/socket/websocket.js";
import { matchTest, socketTestData } from "../data.js";

describe("WebSocket Server", () => {
  let clientSocket: ClientSocket, httpServer: Server, wsServer: MyWebSocket;
  let port: number;

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
    vi.clearAllMocks();

    matchService.playerJoin = vi.fn();
    matchService.playerLeave = vi.fn();
  });

  afterAll(() => {
    clientSocket?.close();
    wsServer?.close();
    httpServer?.close();
  });

  it("should handle match:playerJoin and call matchService", async () => {
    const spy = vi.fn();

    vi.mocked(matchService.playerJoin).mockReturnValueOnce(matchTest);
    clientSocket.on("match:playerHasJoin", spy);

    clientSocket.emit("match:playerJoin", socketTestData);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(matchService.playerJoin).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(matchTest);
  });

  it("should emit match:nameTaken if name is taken", async () => {
    vi.mocked(matchService.playerJoin).mockImplementationOnce(() => {
      throw new Error("Name already taken");
    });

    const spy = vi.fn();
    clientSocket.on("match:nameTaken", spy);

    clientSocket.emit("match:playerJoin", socketTestData);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(spy).toHaveBeenCalledWith(socketTestData.playerName);
  });

  it("should handle match:playerLeft and call matchService", async () => {
    const spy = vi.fn();

    vi.mocked(matchService.playerLeave).mockReturnValueOnce(matchTest);

    clientSocket.on("match:playerHasLeft", spy);

    clientSocket.emit("match:playerLeft", socketTestData);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(matchService.playerLeave).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(matchTest);
  });
});
