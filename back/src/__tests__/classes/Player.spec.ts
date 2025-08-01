import { describe, it, expect, beforeEach } from "vitest";
import { Player } from "../../core/classes/Player";
import { InputDTO, TetrisPiece } from "../../core/types/game";

describe("Player class", () => {
  let player: Player;

  beforeEach(() => {
    player = new Player("Alice");
  });

  it("should initialize correctly", () => {
    expect(player.name).toBe("Alice");
    expect(player.isReady).toBe(false);
    expect(player.input).toEqual({
      up: false,
      left: false,
      right: false,
      down: false,
      space: false,
      spaceHasBeenCounted: false,
      upHasBeenCounted: false,
    });
    expect(player.grid.length).toBe(20);
    expect(player.grid[0].length).toBe(10);
    expect(player.currentPiece).toBeNull();
    expect(player.currentPieceIndex).toBe(0);
    expect(player.score).toBe(0);
    expect(player.linesCleared).toBe(0);
    expect(player.needsNextPiece).toBe(false);
    expect(player.forcedFall).toBe(false);
  });

  it("should set player ready", () => {
    player.setReady();
    expect(player.isReady).toBe(true);
  });

  it("should add score", () => {
    player.addScore(100);
    expect(player.score).toBe(100);
    player.addScore(50);
    expect(player.score).toBe(150);
  });

  it("should add cleared lines", () => {
    player.addLinesCleared(2);
    expect(player.linesCleared).toBe(2);
    player.addLinesCleared(3);
    expect(player.linesCleared).toBe(5);
  });

  it("should update grid", () => {
    const newGrid = Array.from({ length: 20 }, () => new Array(10).fill(1));
    player.updateGrid(newGrid);
    expect(player.grid).not.toBe(newGrid);
    expect(player.grid[0][0]).toBe(1);
  });

  it("should detect game over when top row is filled", () => {
    const grid = Array.from({ length: 20 }, () => new Array(10).fill(0));
    grid[0][5] = 1;
    player.updateGrid(grid);
    expect(player.isGameOver()).toBe(true);
  });

  it("should not detect game over when top row is empty", () => {
    const grid = Array.from({ length: 20 }, () => new Array(10).fill(0));
    player.updateGrid(grid);
    expect(player.isGameOver()).toBe(false);
  });

  it("should return correct state", () => {
    const state = player.getState();
    expect(state).toMatchObject({
      name: "Alice",
      isReady: false,
      grid: player.grid,
      currentPiece: null,
      currentPieceIndex: 0,
      score: 0,
      linesCleared: 0,
    });
  });
});
