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
import { Socket } from "socket.io-client";

export type Cell = number;
export interface GamePiece extends Piece {
  type?: string;
  color?: number;
}

interface GameState {
  board: Board;
  currentPiece: GamePiece | null;
  nextPieces: GamePiece[];
  score: number;
  linesCleared: number;
  status: "idle" | "playing" | "paused" | "gameover";
  gameMode: "solo" | "multiplayer";
  needsNextPiece: boolean;
}

export interface GamerInputs {
  up: boolean;
  left: boolean;
  right: boolean;
  down: boolean;
  space: boolean;
  spaceHasBeenCounted: boolean;
  upHasBeenCounted: boolean;
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

const handlePieceLanded = (state: GameState, socket: Socket) => {
  const [newBoard, linesCleared] = clearLines(state.board);
  state.board = newBoard;
  state.linesCleared += linesCleared;
  state.score += linesCleared * 100 + (linesCleared >= 4 ? 400 : 0);

  state.currentPiece = null;
  state.needsNextPiece = true;

  console.log("Piece landed! Requesting next piece from server");
  socket.emit("game:pieceLanded");
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
    },

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
      state.needsNextPiece = false;
    },

    setNextPiece(state, action: PayloadAction<GamePiece>) {
      state.currentPiece = action.payload;
      state.needsNextPiece = false;
    },

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

    clearNeedsNextPiece(state) {
      state.needsNextPiece = false;
    },
    updateBoard(state, action: PayloadAction<Cell[][]>) {
      state.board = action.payload;
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
  endGame,
  setPieces,
  setNextPiece,
  updateNextPieces,
  clearNeedsNextPiece,
  updatePlayerState,
  updateBoard,
} = slice.actions;

export default slice.reducer;
