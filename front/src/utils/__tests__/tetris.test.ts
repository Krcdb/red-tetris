import { describe, it, expect } from "vitest";
import { initialBoard, getCellColor, formatScore, getLevel, getFallSpeed, renderBoardWithPiece } from "../tetris";

describe("tetris utils", () => {
  describe("initialBoard", () => {
    it("creates a 20x10 board filled with zeros", () => {
      const board = initialBoard();
      expect(board).toHaveLength(20);
      expect(board[0]).toHaveLength(10);
      expect(board.every((row) => row.every((cell) => cell === 0))).toBe(true);
    });
  });

  describe("getCellColor", () => {
    it("returns correct colors for different cell values", () => {
      expect(getCellColor(0)).toBe("transparent");
      expect(getCellColor(1)).toBe("#00f5ff"); // I piece
      expect(getCellColor(2)).toBe("#ffff00"); // O piece
    });

    it("returns transparent for unknown values", () => {
      expect(getCellColor(99)).toBe("transparent");
    });
  });

  describe("formatScore", () => {
    it("formats score with locale string", () => {
      expect(formatScore(1000)).toBe("1,000");
      expect(formatScore(123456)).toBe("123,456");
    });
  });

  describe("getLevel", () => {
    it("calculates level based on lines cleared", () => {
      expect(getLevel(0)).toBe(1);
      expect(getLevel(5)).toBe(1);
      expect(getLevel(10)).toBe(2);
      expect(getLevel(25)).toBe(3);
    });
  });

  describe("getFallSpeed", () => {
    it("calculates fall speed based on level", () => {
      expect(getFallSpeed(1)).toBe(1000);
      expect(getFallSpeed(5)).toBe(600);
      expect(getFallSpeed(10)).toBe(100);
      expect(getFallSpeed(20)).toBe(50); // minimum speed
    });
  });

  describe("renderBoardWithPiece", () => {
    it("returns original board when piece is null", () => {
      const board = initialBoard();
      const result = renderBoardWithPiece(board, null);
      expect(result).toEqual(board);
    });

    it("renders piece on board", () => {
      const board = initialBoard();
      const piece = {
        shape: [
          [1, 1],
          [1, 1],
        ],
        x: 4,
        y: 0,
        color: 2,
      };

      const result = renderBoardWithPiece(board, piece);
      expect(result[0][4]).toBe(2);
      expect(result[0][5]).toBe(2);
      expect(result[1][4]).toBe(2);
      expect(result[1][5]).toBe(2);
    });
  });
});
