import {
  rotatePiece,
  isValidPosition,
  mergePiece,
  clearLines,
  canMoveDown,
} from "../../core/utils/tetris";
import { TetrisPiece, Cell } from "../../core/types/game";
import { describe, expect, it } from "vitest";

describe("utils.ts", () => {
  const samplePiece: TetrisPiece = {
    shape: [
      [1, 0],
      [1, 1],
    ],
    x: 4,
    y: 0,
    color: 3,
  };

  const emptyBoard: Cell[][] = Array.from({ length: 20 }, () =>
    Array(10).fill(0)
  );

  describe("rotatePiece", () => {
    it("should rotate the piece clockwise", () => {
      const rotated = rotatePiece(samplePiece);
      expect(rotated.shape).toEqual([
        [1, 1],
        [1, 0],
      ]);
    });
  });

  describe("isValidPosition", () => {
    it("should return true for valid position", () => {
      expect(isValidPosition(emptyBoard, samplePiece)).toBe(true);
    });

    it("should return false for piece out of bounds", () => {
      const invalidPiece = { ...samplePiece, x: -1 };
      expect(isValidPosition(emptyBoard, invalidPiece)).toBe(false);
    });

    it("should return false if overlapping filled cell", () => {
      const board = structuredClone(emptyBoard);
      board[0][4] = 1; // conflict
      expect(isValidPosition(board, samplePiece)).toBe(false);
    });
  });

  describe("mergePiece", () => {
    it("should merge piece into the board", () => {
      const merged = mergePiece(emptyBoard, samplePiece);
      expect(merged[samplePiece.y][samplePiece.x]).toBe(samplePiece.color);
    });
  });

  describe("clearLines", () => {
    it("should clear full lines", () => {
      const fullBoard = structuredClone(emptyBoard);
      fullBoard[19] = Array(10).fill(1); // last row full

      const { newBoard, linesCleared } = clearLines(fullBoard);
      expect(linesCleared).toBe(1);
      expect(newBoard.length).toBe(20);
      expect(newBoard[19]).toEqual(Array(10).fill(0));
    });

    it("should not clear lines when none are full", () => {
      const { linesCleared } = clearLines(emptyBoard);
      expect(linesCleared).toBe(0);
    });
  });

  describe("canMoveDown", () => {
    it("should return true if piece can move down", () => {
      expect(canMoveDown(emptyBoard, samplePiece)).toBe(true);
    });

    it("should return false if piece is at bottom", () => {
      const pieceAtBottom = { ...samplePiece, y: 19 };
      expect(canMoveDown(emptyBoard, pieceAtBottom)).toBe(false);
    });
  });
});
