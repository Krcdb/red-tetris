import { describe, it, expect } from "vitest";
import lobbyReducer, { setLobbyConfig, updatePlayers, setError, setLoading, resetLobby } from "../lobbySlice";

const initialState = {
  players: [],
  room: "",
  playerName: "",
  canStart: false,
  isLoading: false,
  error: null,
};

describe("lobbySlice", () => {
  it("should handle initial state", () => {
    const result = lobbyReducer(undefined, { type: "unknown" });
    expect(result).toEqual(initialState);
  });

  it("should handle setLobbyConfig", () => {
    const config = { room: "test-room", playerName: "TestPlayer" };
    const actual = lobbyReducer(initialState, setLobbyConfig(config));
    expect(actual.room).toBe("test-room");
    expect(actual.playerName).toBe("TestPlayer");
  });

  it("should handle updatePlayers", () => {
    const state = { ...initialState, playerName: "TestPlayer" };
    const match = {
      player: [
        { name: "TestPlayer", isLeader: true },
        { name: "Player2", isLeader: false },
      ],
    };
    const actual = lobbyReducer(state, updatePlayers(match));
    expect(actual.players).toHaveLength(2);
    expect(actual.canStart).toBe(true);
  });

  it("should handle setError", () => {
    const actual = lobbyReducer(initialState, setError("Test error"));
    expect(actual.error).toBe("Test error");
  });

  it("should handle setLoading", () => {
    const actual = lobbyReducer(initialState, setLoading(true));
    expect(actual.isLoading).toBe(true);
  });

  it("should handle resetLobby", () => {
    const modifiedState = { ...initialState, room: "test", error: "error" };
    const actual = lobbyReducer(modifiedState, resetLobby());
    expect(actual).toEqual(initialState);
  });
});
