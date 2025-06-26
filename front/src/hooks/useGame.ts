import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import {
  startGame,
  pauseGame,
  resumeGame,
  clearNeedsNextPiece,
  movePiece,
  rotatePiece,
  // softDrop,
  // hardDrop,
} from "../redux/gameSlice";
import socket from "../utils/socket";

export function useGame() {
  const dispatch = useDispatch<AppDispatch>();
  const { status, currentPiece, board, needsNextPiece } = useSelector(
    (state: RootState) => state.game
  );

  // Watch for when we need next piece and emit socket event
  useEffect(() => {
    if (needsNextPiece && socket.connected) {
      console.log("Requesting next piece from server");
      socket.emit("game:pieceLanded");
      dispatch(clearNeedsNextPiece());
    }
  }, [needsNextPiece, dispatch]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      console.log("keydown event fired:", e.code, e.key);

      if (status !== "playing") return;

      const key = e.key.toLowerCase();
      let inputChanges: any = null;

      // Prevent default behavior for game keys
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(
          e.code
        ) ||
        ["a", "d", "w", "s"].includes(key)
      ) {
        e.preventDefault();
      }

      // ONLY send to server - no local actions
      if (e.code === "ArrowLeft" || key === "a") {
        inputChanges = { left: true };
      } else if (e.code === "ArrowRight" || key === "d") {
        inputChanges = { right: true };
      } else if (e.code === "ArrowUp" || key === "w") {
        inputChanges = { up: true, upHasBeenCounted: false };
      } else if (e.code === "ArrowDown" || key === "s") {
        inputChanges = { down: true };
      } else if (e.code === "Space") {
        inputChanges = { space: true, spaceHasBeenCounted: false };
      }

      // Send input to server with throttling to prevent spam
      if (inputChanges && socket.connected) {
        // Add debouncing to prevent input spam
        clearTimeout(inputTimeoutRef.current);
        inputTimeoutRef.current = setTimeout(() => {
          console.log("Sending input to backend:", inputChanges);
          socket.emit("game:playerInputChanges", {
            input: {
              up: false,
              left: false,
              right: false,
              down: false,
              space: false,
              spaceHasBeenCounted: false,
              upHasBeenCounted: false,
              ...inputChanges,
            },
          });
        }, 50); // 50ms debounce
      }
    },
    [status, dispatch]
  );

  // Add timeout ref for input debouncing
  const inputTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, []);

  // Set up keyboard event listeners
  useEffect(() => {
    console.log("Setting up keyboard listeners, game status:", status);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onKey]);

  // Game control functions
  const start = useCallback(
    (gameMode?: "solo" | "multiplayer") => {
      console.log("Starting game with mode:", gameMode);
      dispatch(startGame({ gameMode: gameMode || "solo" }));
    },
    [dispatch]
  );

  const pause = useCallback(() => {
    console.log("Pausing game");
    dispatch(pauseGame());
  }, [dispatch]);

  const resume = useCallback(() => {
    console.log("Resuming game");
    dispatch(resumeGame());
  }, [dispatch]);

  return {
    status,
    currentPiece,
    board,
    start,
    pause,
    resume,
  };
}
