import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { createServer, Server } from "http"
import { io as Client, Socket as ClientSocket } from "socket.io-client"
import { matchService } from "../../core/match/MatchService.js"
import MyWebSocket from "../../core/socket/websocket.js"
import { Player } from "../../core/types/player.js"

vi.mock("../../core/match/MatchService.js", () => ({
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

    clientSocket = Client(`http://localhost:${port}`)

    await new Promise<void>((resolve, reject) => {
      clientSocket.on("connect", () => resolve())
      clientSocket.on("connect_error", reject)
    })
  })

  afterAll(() => {
    clientSocket?.close()
    wsServer?.close()
    httpServer?.close()
  })

  it("should handle match:playerJoin and call matchService", async () => {
    
    const testData = {
      playerName: "bob",
      room: "test-room"
    }

    const spy = vi.fn()
    clientSocket.on("match:playerHasJoin", spy)

    clientSocket.emit("match:playerJoin", testData)

    await new Promise(resolve => setTimeout(resolve, 100))

    const playerData: Player = {id: clientSocket.id!, name: testData.playerName}

    expect(matchService.playerJoin).toHaveBeenCalledWith(playerData, testData.room)
    expect(spy).toHaveBeenCalledWith(playerData)
  })

  it("should handle match:playerLeft and call matchService", async () => {
    const testData = {
      playerName: "bob",
      room: "test-room"
    }

    const spy = vi.fn()
    clientSocket.on("match:playerHasLeft", spy)
    
    clientSocket.emit("match:playerLeft", testData)
    
    const playerData: Player = {id: clientSocket.id!, name: testData.playerName}

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(matchService.playerLeave).toHaveBeenCalledWith(playerData, testData.room)
    expect(spy).toHaveBeenCalledWith(playerData)
  })
})
