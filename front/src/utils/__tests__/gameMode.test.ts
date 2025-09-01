import { describe, it, expect } from "vitest";
import { validateGameMode, isValidGameMode, getGameModeDisplay } from "../gameMode";

describe("gameMode utils", () => {
  describe("validateGameMode", () => {
    it("returns valid game mode when input is valid", () => {
      expect(validateGameMode("normal")).toBe("normal");
      expect(validateGameMode("speed")).toBe("speed");
      expect(validateGameMode("invisible")).toBe("invisible");
    });

    it("returns fallback for invalid game mode", () => {
      expect(validateGameMode("invalid")).toBe("normal");
      expect(validateGameMode("invalid", "speed")).toBe("speed");
    });

    it("handles null and undefined inputs", () => {
      // Fix: Cast to string or provide fallback
      expect(validateGameMode(null as any)).toBe("normal");
      expect(validateGameMode(undefined as any)).toBe("normal");
    });
  });

  describe("isValidGameMode", () => {
    it("returns true for valid modes", () => {
      expect(isValidGameMode("normal")).toBe(true);
      expect(isValidGameMode("speed")).toBe(true);
      expect(isValidGameMode("invisible")).toBe(true);
      expect(isValidGameMode("no-preview")).toBe(true);
    });

    it("returns false for invalid modes", () => {
      expect(isValidGameMode("invalid")).toBe(false);
      expect(isValidGameMode("")).toBe(false);
    });
  });

  describe("getGameModeDisplay", () => {
    it("returns correct display text", () => {
      expect(getGameModeDisplay("normal")).toBe("🎮 Normal Mode");
      expect(getGameModeDisplay("speed")).toBe("⚡ Speed Mode");
      expect(getGameModeDisplay("invisible")).toBe("👻 Invisible Mode");
      expect(getGameModeDisplay("no-preview")).toBe("🔮 No Preview Mode");
    });

    it("handles invalid modes gracefully", () => {
      expect(getGameModeDisplay("invalid" as any)).toBe("🎮 Normal Mode");
    });
  });
});
