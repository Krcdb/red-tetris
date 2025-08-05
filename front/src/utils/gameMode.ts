export const VALID_GAME_MODES = [
  "normal",
  "invisible",
  "no-preview",
  "speed",
] as const;
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

export function validateGameMode(
  mode: string,
  fallback: GameMode = "normal"
): GameMode {
  if (isValidGameMode(mode)) {
    return mode;
  }
  console.warn(`Invalid game mode "${mode}", falling back to "${fallback}"`);
  return fallback;
}

export function getGameModeDisplay(mode: string): string {
  const validMode = validateGameMode(mode);
  const info = GAME_MODE_INFO[validMode];
  return `${info.emoji} ${info.name} Mode`;
}

export function getGameModeDescription(mode: string): string {
  const validMode = validateGameMode(mode);
  return GAME_MODE_INFO[validMode].description;
}
