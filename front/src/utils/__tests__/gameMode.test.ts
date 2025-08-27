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
      expect(validateGameMode(null as string | null)).toBe("normal");
      expect(validateGameMode(undefined as string | undefined)).toBe("normal");
    });
  });

  describe("isValidGameMode", () => {
    it("returns true for valid modes", () => {
      expect(isValidGameMode("normal")).toBe(true);
      expect(isValidGameMode("speed")).toBe(true);
      expect(isValidGameMode("invisible")).toBe(true);
    });

    it("returns false for invalid modes", () => {
      expect(isValidGameMode("invalid")).toBe(false);
      expect(isValidGameMode("")).toBe(false);
    });
  });

  describe("getGameModeDisplay", () => {
    it("returns correct display string for valid modes", () => {
      expect(getGameModeDisplay("normal")).toContain("Normal");
      expect(getGameModeDisplay("speed")).toContain("Speed");
      expect(getGameModeDisplay("invisible")).toContain("Invisible");
    });
  });
});
