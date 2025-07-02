import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialBoard, Board, Piece } from "../utils/tetris";

export interface GamerInputs {
  up: boolean;
  left: boolean;
  right: boolean;
  down: boolean;
  space: boolean;
  spaceHasBeenCounted: boolean;
  upHasBeenCounted: boolean;
}

interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextPieces: Piece[];
  score: number;
  linesCleared: number;
  level: number;
  status: "idle" | "playing" | "paused" | "gameOver";
  gameMode: "solo" | "multiplayer";
  room: string;
  playerName: string;
  opponents: Array<{
    name: string;
    board: Board;
    score: number;
    linesCleared: number;
  }>;
  isLoading: boolean;
  error: string | null;
  needsNextPiece: boolean;
  gamers: any[];
}

const initialState: GameState = {
  board: initialBoard(),
  currentPiece: null,
  nextPieces: [],
  score: 0,
  linesCleared: 0,
  level: 1,
  status: "idle",
  gameMode: "solo",
  room: "",
  playerName: "",
  opponents: [],
  isLoading: false,
  error: null,
  needsNextPiece: false,
  gamers: [],
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    // Server state updates
    updateGameState: (state, action: PayloadAction<any>) => {
      const serverState = action.payload;

      // Find current player's data
      const currentPlayer = serverState.gamers?.find(
        (g: any) => g.name === state.playerName
      );
      if (currentPlayer) {
        state.board = currentPlayer.grid || state.board;
        state.currentPiece = currentPlayer.currentPiece;
        state.score = currentPlayer.score || 0;
        state.linesCleared = currentPlayer.linesCleared || 0;
        state.level = Math.floor(state.linesCleared / 10) + 1;

        state.gamers = serverState.gamers || [];

        if (
          typeof serverState.currentPieceIndex === "number" &&
          Array.isArray(serverState.gamers) &&
          Array.isArray(serverState.nextPieces)
        ) {
          // Use the shared next pieces for preview
          state.nextPieces = serverState.nextPieces;
        }
      }

      // Update opponents
      state.opponents =
        serverState.gamers
          ?.filter((g: any) => g.name !== state.playerName)
          .map((g: any) => ({
            name: g.name,
            board: g.grid || initialBoard(),
            score: g.score || 0,
            linesCleared: g.linesCleared || 0,
          })) || [];

      state.status = serverState.isRunning ? "playing" : state.status;
    },
    updatePlayerState: (
      state,
      action: PayloadAction<{
        score: number;
        linesCleared: number;
        board?: any;
      }>
    ) => {
      const { score, linesCleared, board } = action.payload;
      state.score = score;
      state.linesCleared = linesCleared;
      state.level = Math.floor(linesCleared / 10) + 1;
      if (board) state.board = board;
    },

    setGameConfig: (
      state,
      action: PayloadAction<{
        room: string;
        playerName: string;
        gameMode: "solo" | "multiplayer";
      }>
    ) => {
      state.room = action.payload.room;
      state.playerName = action.payload.playerName;
      state.gameMode = action.payload.gameMode;
    },

    gameSetup: (state) => {
      state.status = "idle";
      state.isLoading = false;
    },

    gameStarted: (state) => {
      state.status = "playing";
      state.isLoading = false;
    },

    // Add missing actions for Solo component
    startGame: (
      state,
      action: PayloadAction<{ gameMode: "solo" | "multiplayer" }>
    ) => {
      state.status = "playing";
      state.gameMode = action.payload.gameMode;
      state.score = 0;
      state.linesCleared = 0;
      state.level = 1;
      state.board = initialBoard();
    },

    pauseGame: (state) => {
      if (state.status === "playing") {
        state.status = "paused";
      }
    },

    resumeGame: (state) => {
      if (state.status === "paused") {
        state.status = "playing";
      }
    },

    gamePaused: (state) => {
      state.status = "paused";
    },

    gameResumed: (state) => {
      state.status = "playing";
    },

    gameOver: (state) => {
      state.status = "gameOver";
    },

    setPieces: (
      state,
      action: PayloadAction<{ currentPiece: Piece | null; nextPieces: Piece[] }>
    ) => {
      state.currentPiece = action.payload.currentPiece;
      state.nextPieces = action.payload.nextPieces;
      state.needsNextPiece = false;
    },

    updateBoard: (
      state,
      action: PayloadAction<{
        board: Board;
        score: number;
        linesCleared: number;
      }>
    ) => {
      state.board = action.payload.board;
      state.score = action.payload.score;
      state.linesCleared = action.payload.linesCleared;
      state.level = Math.floor(state.linesCleared / 10) + 1;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    resetGame: () => initialState,
  },
});

export const {
  updateGameState,
  setGameConfig,
  gameSetup,
  gameStarted,
  startGame,
  pauseGame,
  resumeGame,
  gamePaused,
  gameResumed,
  gameOver,
  setPieces,
  updateBoard,
  setLoading,
  setError,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
