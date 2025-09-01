export const VALID_GAME_MODES = ["normal", "invisible", "no-preview", "speed"] as const;
export type GameMode = (typeof VALID_GAME_MODES)[number];

export interface GameModeInfo {
  id: GameMode;
  name: string;
  description: string;
  emoji: string;
}

export const GAME_MODE_INFO: Record<GameMode, GameModeInfo> = {
  normal: {
    id: "normal",
    name: "Normal",
    description: "Classic Tetris experience",
    emoji: "🎮",
  },
  invisible: {
    id: "invisible",
    name: "Invisible",
    description: "Pieces disappear after placement",
    emoji: "👻",
  },
  "no-preview": {
    id: "no-preview",
    name: "No Preview",
    description: "Next piece is hidden",
    emoji: "🔮",
  },
  speed: {
    id: "speed",
    name: "Speed",
    description: "Faster falling pieces",
    emoji: "⚡",
  },
};

export function isValidGameMode(mode: string): mode is GameMode {
  return VALID_GAME_MODES.includes(mode as GameMode);
}

export function validateGameMode(mode: string | null | undefined, fallback: GameMode = "normal"): GameMode {
  // Handle null/undefined by providing a default
  const safeMode = mode || fallback;
  return isValidGameMode(safeMode) ? safeMode : fallback;
}

export function getGameModeDisplay(mode: GameMode): string {
  const info = GAME_MODE_INFO[mode] || GAME_MODE_INFO.normal;
  return `${info.emoji} ${info.name} Mode`;
}
