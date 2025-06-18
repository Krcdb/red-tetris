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

export type Cell = number; // 0 = empty, >0 = filled
export interface GamePiece extends Piece {}

interface GameState {
  board: Board;
  currentPiece: GamePiece | null;
  nextPieces: GamePiece[];
  status: "idle" | "playing" | "gameover";
}

const initialState: GameState = {
  board: initialBoard(),
  currentPiece: null,
  nextPieces: [], // we’ll generate these in startGame
  status: "idle",
};

function generatePieces(count = 5): GamePiece[] {
  // TODO: replace with seeded RNG & all 7 tetrominos
  const pieces: GamePiece[] = [];
  for (let i = 0; i < count; i++) {
    // simple I-piece as example
    pieces.push({ shape: [[1, 1, 1, 1]], x: 3, y: 0 });
  }
  return pieces;
}

const slice = createSlice({
  name: "game",
  initialState,
  reducers: {
    startGame(state) {
      state.board = initialBoard();
      state.nextPieces = generatePieces(10);
      state.currentPiece = state.nextPieces.shift()!;
      state.status = "playing";
    },
    setGameState(
      state,
      action: PayloadAction<{
        board: Board;
        currentPiece: Piece | null;
        nextPieces: Piece[];
        status: "idle" | "playing" | "gameover";
      }>
    ) {
      const { board, currentPiece, nextPieces, status } = action.payload;
      state.board = board;
      state.currentPiece = currentPiece;
      state.nextPieces = nextPieces;
      state.status = status;
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
        // can't drop further → lock
        state.board = mergePiece(state.board, state.currentPiece);
        const [cleared, lines] = clearLines(state.board);
        state.board = cleared;
        // spawn next
        state.currentPiece = state.nextPieces.shift() || null;
        if (!state.currentPiece) state.status = "gameover";
      }
    },

    hardDrop(state) {
      if (!state.currentPiece) return;
      const dropped = fnHardDrop(state.board, state.currentPiece);
      state.board = mergePiece(state.board, dropped);
      const [cleared] = clearLines(state.board);
      state.board = cleared;
      state.currentPiece = state.nextPieces.shift() || null;
      if (!state.currentPiece) state.status = "gameover";
    },

    endGame(state) {
      state.status = "gameover";
    },
  },
});

export const {
  startGame,
  movePiece,
  rotatePiece,
  softDrop,
  hardDrop,
  endGame,
  setGameState,
} = slice.actions;

export default slice.reducer;
