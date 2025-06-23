import { describe, it, expect, beforeEach, vi } from "vitest"
import { matchService } from "../../../socket/services/MatchService"
import { Player } from "../../../types/player"

describe("MatchService", () => {
  const player1: Player = { name: "Alice" }
  const player2: Player = { name: "Bob" }

  beforeEach(() => {
    matchService.matchs = {}
    vi.clearAllMocks()
  })

  it("should create a new room when a player joins", () => {
    matchService.playerJoin(player1, "room1")

    expect(matchService.matchs["room1"]).toBeDefined()
    expect(matchService.matchs["room1"].player).toHaveLength(1)
  })

  it("should not add the same player twice", () => {
    matchService.playerJoin(player1, "room1")
    matchService.playerJoin(player1, "room1")

    expect(matchService.matchs["room1"].player).toHaveLength(1)
  })

  it("should allow multiple players in a room", () => {
    matchService.playerJoin(player1, "room1")
    matchService.playerJoin(player2, "room1")

    expect(matchService.matchs["room1"].player).toHaveLength(2)
  })

  it("should remove a player and delete room if empty", () => {
    matchService.playerJoin(player1, "room1")
    matchService.playerLeave(player1, "room1")

    expect(matchService.matchs["room1"]).toBeUndefined()
  })

  it("should warn if room does not exist", () => {
    matchService.playerLeave(player1, "roomX")
  })

  it("should warn if player not in room", () => {
    matchService.playerJoin(player2, "room1")
    matchService.playerLeave(player1, "room1")

    expect(matchService.matchs["room1"].player).toHaveLength(1)
  })
})
