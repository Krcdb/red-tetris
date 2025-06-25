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
export interface GamePiece extends Piece {}

interface GameState {
  board: Board;
  currentPiece: GamePiece | null;
  nextPieces: GamePiece[];
  score: number;
  linesCleared: number;
  status: "idle" | "playing" | "paused" | "gameover";
}

const initialState: GameState = {
  board: initialBoard(),
  currentPiece: null,
  nextPieces: [],
  score: 0,
  linesCleared: 0,
  status: "idle",
};

function generatePieces(count = 5): GamePiece[] {
  const PIECES = [
    { shape: [[1, 1, 1, 1]], x: 3, y: 0 }, // I piece
    {
      shape: [
        [1, 1],
        [1, 1],
      ],
      x: 3,
      y: 0,
    }, // O piece
    {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      x: 3,
      y: 0,
    }, // T piece
    {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      x: 3,
      y: 0,
    }, // S piece
    {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      x: 3,
      y: 0,
    }, // Z piece
    {
      shape: [
        [1, 1, 1],
        [1, 0, 0],
      ],
      x: 3,
      y: 0,
    }, // L piece
    {
      shape: [
        [1, 1, 1],
        [0, 0, 1],
      ],
      x: 3,
      y: 0,
    }, // J piece
  ];
  const pieces: GamePiece[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * PIECES.length);
    pieces.push(PIECES[randomIndex]);
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
    syncGameState(state, action: PayloadAction<any>) {
      // Sync with backend game state
      const backendState = action.payload;
      // Map backend state to frontend state as needed
      // This depends on how you want to handle the backend game state
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
        state.board = mergePiece(state.board, state.currentPiece);
        const [cleared, lines] = clearLines(state.board);
        state.board = cleared;
        if (state.nextPieces.length < 3) {
          state.nextPieces.push(...generatePieces(10));
        }
        state.currentPiece = state.nextPieces.shift() || null;
        if (
          state.currentPiece !== null &&
          !isValidPosition(state.board, state.currentPiece)
        ) {
          state.status = "gameover";
        }
      }
    },

    hardDrop(state) {
      if (!state.currentPiece) return;

      const dropped = fnHardDrop(state.board, state.currentPiece);
      state.board = mergePiece(state.board, dropped);

      const [newBoard, linesCleared] = clearLines(state.board);
      state.board = newBoard;
      state.score += linesCleared * 100 + (linesCleared >= 4 ? 400 : 0);

      if (state.nextPieces.length < 3) {
        state.nextPieces.push(...generatePieces(10));
      }

      state.currentPiece = state.nextPieces.shift() || null;

      if (
        state.currentPiece !== null &&
        !isValidPosition(state.board, state.currentPiece)
      ) {
        state.status = "gameover";
      }
    },

    clearLines(state) {
      const [newBoard, linesCleared] = clearLines(state.board);
      state.board = newBoard;
      state.linesCleared += linesCleared;
      state.score += linesCleared * 100;
      if (linesCleared >= 4) {
        state.score += 400;
      }
    },

    endGame(state) {
      state.status = "gameover";
    },
  },
});

export const {
  startGame,
  setGameState,
  pauseGame,
  resumeGame,
  movePiece,
  rotatePiece,
  softDrop,
  hardDrop,
  endGame,
  syncGameState,
} = slice.actions;

export default slice.reducer;
