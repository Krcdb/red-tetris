import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Board,
  Piece,
  initialBoard,
  mergePiece,
  clearLines,
  isValidPosition,
  softDrop as fnSoftDrop,
  hardDrop as fnHardDrop,
  rotate as fnRotate,
  move as fnMove,
} from "../utils/tetris";

export type Cell = number;
export interface GamePiece extends Piece {
  type?: string; // Add this line
  color?: number; // Add this line too if it's missing
}

interface GameState {
  board: Board;
  currentPiece: GamePiece | null;
  nextPieces: GamePiece[]; // Always comes from server
  score: number;
  linesCleared: number;
  status: "idle" | "playing" | "paused" | "gameover";
  gameMode: "solo" | "multiplayer";
  needsNextPiece: boolean; // Flag to indicate we need a new piece from server
}

const initialState: GameState = {
  board: initialBoard(),
  currentPiece: null,
  nextPieces: [],
  score: 0,
  linesCleared: 0,
  status: "idle",
  gameMode: "solo",
  needsNextPiece: false,
};

// Helper function for piece landing logic
const handlePieceLanded = (state: GameState) => {
  const [newBoard, linesCleared] = clearLines(state.board);
  state.board = newBoard;
  state.linesCleared += linesCleared;
  state.score += linesCleared * 100 + (linesCleared >= 4 ? 400 : 0);

  // Clear current piece - server will send next one
  state.currentPiece = null;
  state.needsNextPiece = true; // Flag that we need next piece from server
};

const slice = createSlice({
  name: "game",
  initialState,
  reducers: {
    startGame(
      state,
      action: PayloadAction<{ gameMode: "solo" | "multiplayer" }>
    ) {
      state.board = initialBoard();
      state.gameMode = action.payload.gameMode;
      state.status = "playing";
      state.score = 0;
      state.linesCleared = 0;
      state.needsNextPiece = false;
      // Note: currentPiece and nextPieces will be set by server via setPieces
    },

    // Server sets all pieces - unified for solo and multiplayer
    setPieces(
      state,
      action: PayloadAction<{
        currentPiece: GamePiece | null;
        nextPieces: GamePiece[];
      }>
    ) {
      const { currentPiece, nextPieces } = action.payload;
      state.currentPiece = currentPiece;
      state.nextPieces = nextPieces;
      state.needsNextPiece = false; // Reset flag when we receive pieces
    },

    // Server sends next piece when current piece lands
    setNextPiece(state, action: PayloadAction<GamePiece>) {
      state.currentPiece = action.payload;
      state.needsNextPiece = false; // Reset flag when we receive next piece
    },

    // Server sends updated next pieces for preview
    updateNextPieces(state, action: PayloadAction<GamePiece[]>) {
      state.nextPieces = action.payload;
    },

    updatePlayerState(
      state,
      action: PayloadAction<{
        score: number;
        linesCleared: number;
        board?: Cell[][];
      }>
    ) {
      const { score, linesCleared, board } = action.payload;
      state.score = score;
      state.linesCleared = linesCleared;
      if (board) state.board = board;
    },

    pauseGame(state) {
      if (state.status === "playing") {
        state.status = "paused";
      }
    },

    resumeGame(state) {
      if (state.status === "paused") {
        state.status = "playing";
      }
    },

    movePiece(state, action: PayloadAction<{ dx: number; dy: number }>) {
      if (!state.currentPiece) return;
      const { dx, dy } = action.payload;
      const moved = fnMove(state.currentPiece, dx, dy);
      if (isValidPosition(state.board, moved)) {
        state.currentPiece = moved;
      }
    },

    rotatePiece(state) {
      if (!state.currentPiece) return;
      const rotated = fnRotate(state.currentPiece.shape);
      const candidate: GamePiece = { ...state.currentPiece, shape: rotated };
      if (isValidPosition(state.board, candidate)) {
        state.currentPiece = candidate;
      }
    },

    softDrop(state) {
      if (!state.currentPiece) return;
      const dropped = fnSoftDrop(state.board, state.currentPiece);
      if (dropped !== state.currentPiece) {
        state.currentPiece = dropped;
      } else {
        // Piece has landed - handle locally and flag for server
        state.board = mergePiece(state.board, state.currentPiece);
        handlePieceLanded(state); // Use helper function instead of this.
      }
    },

    hardDrop(state) {
      if (!state.currentPiece) return;
      const dropped = fnHardDrop(state.board, state.currentPiece);
      state.board = mergePiece(state.board, dropped);
      handlePieceLanded(state); // Use helper function instead of this.
    },

    // Reset the needs next piece flag (called when server responds)
    clearNeedsNextPiece(state) {
      state.needsNextPiece = false;
    },

    endGame(state) {
      state.status = "gameover";
    },
  },
});

export const {
  startGame,
  pauseGame,
  resumeGame,
  movePiece,
  rotatePiece,
  softDrop,
  hardDrop,
  endGame,
  setPieces,
  setNextPiece,
  updateNextPieces,
  clearNeedsNextPiece,
  updatePlayerState,
} = slice.actions;

export default slice.reducer;
