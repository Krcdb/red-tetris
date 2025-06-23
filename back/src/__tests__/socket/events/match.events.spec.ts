import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { createServer, Server } from "http"
import { io as Client, Socket as ClientSocket } from "socket.io-client"
import MyWebSocket from "../../../socket/websocket.js"
import { matchService } from "../../../socket/services/MatchService.js"

vi.mock("../../../socket/services/MatchService.js", () => ({
  matchService: {
    playerJoin: vi.fn(),
    playerLeave: vi.fn(),
  }
}))

describe("WebSocket Server", () => {
  let httpServer: Server, wsServer: MyWebSocket, clientSocket: ClientSocket
  let port: number

  beforeAll(async () => {
    httpServer = createServer()
    wsServer = MyWebSocket.getInstance(httpServer)

    await new Promise<void>(resolve => httpServer.listen(0, resolve))
    port = (httpServer.address() as any).port
  })

  afterAll(() => {
    clientSocket?.close()
    wsServer?.close()
    httpServer?.close()
  })

  it("should handle match:playerJoin and call matchService", async () => {
    clientSocket = Client(`http://localhost:${port}`)

    await new Promise<void>((resolve, reject) => {
      clientSocket.on("connect", () => resolve())
      clientSocket.on("connect_error", reject)
    })

    const testData = {
      player: { name: "bob" },
      room: "test-room"
    }

    const spy = vi.fn()
    clientSocket.on("match:playerHasJoin", spy)

    clientSocket.emit("match:playerJoin", testData)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(matchService.playerJoin).toHaveBeenCalledWith(testData.player, testData.room)
    expect(spy).toHaveBeenCalledWith(testData.player)
  })

  it("should handle match:playerLeft and call matchService", async () => {
    const testData = {
      player: { name: "bob" },
      room: "test-room"
    }

    const spy = vi.fn()
    clientSocket.on("match:playerHasLeft", spy)

    clientSocket.emit("match:playerLeft", testData)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(matchService.playerLeave).toHaveBeenCalledWith(testData.player, testData.room)
    expect(spy).toHaveBeenCalledWith(testData.player)
  })
})
