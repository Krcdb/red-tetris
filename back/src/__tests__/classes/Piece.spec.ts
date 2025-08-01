import { describe, it, expect, beforeEach, vi } from "vitest";
import { Piece } from "../../core/classes/Piece.js";
import type { Cell } from "../../core/types/game.js";

describe("Piece", () => {
  let emptyBoard: Cell[][];

  beforeEach(() => {
    emptyBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
  });

  it("should create a T piece at default position", () => {
    const piece = new Piece("T");
    expect(piece.shape).toEqual([
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ]);
    expect(piece.x).toBe(4);
    expect(piece.y).toBe(0);
    expect(piece.color).toBe(3);
  });

  it("should rotate the piece", () => {
    const piece = new Piece("L");
    const rotated = piece.rotate();
    expect(rotated.shape).not.toEqual(piece.shape);
    expect(rotated.rotation).toBe((piece.rotation + 1) % 4);
  });

  it("should move the piece", () => {
    const piece = new Piece("I", 4, 1);
    const moved = piece.move(1, 2);
    expect(moved.x).toBe(5);
    expect(moved.y).toBe(3);
  });

  it("should clone the piece", () => {
    const piece = new Piece("S", 2, 3);
    const clone = piece.clone();
    expect(clone).not.toBe(piece);
    expect(clone).toMatchObject(piece);
  });

  it("should validate position inside empty board", () => {
    const piece = new Piece("O");
    expect(piece.isValidPosition(emptyBoard)).toBe(true);
  });

  it("should invalidate position outside board", () => {
    const piece = new Piece("O", -1, 0);
    expect(piece.isValidPosition(emptyBoard)).toBe(false);
  });

  it("should return true if can move down", () => {
    const piece = new Piece("T");
    expect(piece.canMoveDown(emptyBoard)).toBe(true);
  });

  it("should return false if blocked below", () => {
    const board = structuredClone(emptyBoard);
    board[1][4] = 1;
    const piece = new Piece("O", 4, 0);
    expect(piece.canMoveDown(board)).toBe(false);
  });

  it("should perform hard drop correctly", () => {
    const piece = new Piece("O", 4, 0);
    const dropped = piece.hardDrop(emptyBoard);
    expect(dropped.y).toBeGreaterThan(piece.y);
    expect(dropped.canMoveDown(emptyBoard)).toBe(false);
  });

  it("should merge into board correctly", () => {
    const piece = new Piece("O", 4, 0);
    const mergedBoard = piece.mergeIntoBoard(emptyBoard);
    expect(mergedBoard[0][4]).toBe(piece.color);
    expect(mergedBoard[1][5]).toBe(piece.color);
  });

  it("should rotate with wall kicks", () => {
    const piece = new Piece("J", 0, 0);
    const rotated = piece.rotateWallKick(emptyBoard);
    expect(rotated.rotation).toBe(1);
    expect(rotated.x).not.toBeLessThan(0); // wall kick applied
  });

  it("should generate a random piece", () => {
    const random = Piece.generateRandomPiece();
    expect(random).toBeInstanceOf(Piece);
    expect(random.shape).toBeDefined();
    expect(typeof random.color).toBe("number");
  });

  it("should generate a sequence of random pieces", () => {
    const sequence = Piece.generatePieceSequence(5);
    expect(sequence.length).toBe(5);
    sequence.forEach((p) => {
      expect(p).toBeInstanceOf(Piece);
    });
  });
});
