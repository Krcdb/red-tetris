import { beforeEach, describe, expect, it } from "vitest";

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
      down: false,
      left: false,
      right: false,
      space: false,
      spaceHasBeenCounted: false,
      up: false,
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

  it("should set hasLost", () => {
    expect(player.hasLost).toBe(false);
    player.setHasLost();
    expect(player.hasLost).toBe(true);
  });

  it("should set a piece and clear needsNextPiece", () => {
    const piece: TetrisPiece = {
      color: 1,
      rotation: 0,
      shape: [[1]],
      type: "T",
      x: 4,
      y: 0,
    };
    player.needsNextPiece = true;
    player.setPiece(piece, 7);
    expect(player.currentPiece).toEqual(piece);
    expect(player.currentPieceIndex).toBe(7);
    expect(player.needsNextPiece).toBe(false);
  });

  it("updateInput resets spaceHasBeenCounted when space goes back to released", () => {
    const input: InputDTO = {
      down: false,
      left: false,
      right: false,
      space: true,
      up: false,
    };
    player.updateInput(input);
    expect(player.input.space).toBe(true);
    expect(player.input.spaceHasBeenCounted).toBe(false);

    // Simulate that the loop counted the press.
    player.input.spaceHasBeenCounted = true;

    // Same value (still pressed) → counted stays true.
    player.updateInput(input);
    expect(player.input.spaceHasBeenCounted).toBe(true);

    // Release → counted resets to false.
    player.updateInput({ ...input, space: false });
    expect(player.input.spaceHasBeenCounted).toBe(false);
  });

  it("updateInput resets upHasBeenCounted on release", () => {
    const input: InputDTO = {
      down: false,
      left: false,
      right: false,
      space: false,
      up: true,
    };
    player.updateInput(input);
    player.input.upHasBeenCounted = true;
    player.updateInput(input);
    expect(player.input.upHasBeenCounted).toBe(true);
    player.updateInput({ ...input, up: false });
    expect(player.input.upHasBeenCounted).toBe(false);
  });

  it("should return correct state", () => {
    const state = player.getState();
    expect(state).toMatchObject({
      currentPiece: null,
      currentPieceIndex: 0,
      grid: player.grid,
      isReady: false,
      linesCleared: 0,
      name: "Alice",
      score: 0,
    });
  });
});
