import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import {
  startGame,
  pauseGame,
  resumeGame,
  movePiece,
  rotatePiece,
  softDrop,
  hardDrop,
} from "../redux/gameSlice";
import socket from "../utils/socket";

export function useGame() {
  const dispatch = useDispatch<AppDispatch>();
  const { status, currentPiece, board } = useSelector(
    (state: RootState) => state.game
  );
  const timerRef = useRef<NodeJS.Timeout>();

  // Auto-drop timer for pieces
  useEffect(() => {
    if (status !== "playing") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      dispatch(softDrop());
    }, 1000); // Drop every second

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, dispatch]);

  // Keyboard event handler
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      console.log("keydown event fired:", e.code, e.key);

      if (status !== "playing") return;

      const key = e.key.toLowerCase();
      let localAction: (() => void) | null = null;
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

      // Map keys to actions and inputs
      if (e.code === "ArrowLeft" || key === "a") {
        localAction = () => dispatch(movePiece({ dx: -1, dy: 0 }));
        inputChanges = { left: true };
      } else if (e.code === "ArrowRight" || key === "d") {
        localAction = () => dispatch(movePiece({ dx: 1, dy: 0 }));
        inputChanges = { right: true };
      } else if (e.code === "ArrowUp" || key === "w") {
        localAction = () => dispatch(rotatePiece());
        inputChanges = { up: true, upHasBeenCounted: false };
      } else if (e.code === "ArrowDown" || key === "s") {
        localAction = () => dispatch(softDrop());
        inputChanges = { down: true };
      } else if (e.code === "Space") {
        localAction = () => dispatch(hardDrop());
        inputChanges = { space: true, spaceHasBeenCounted: false };
      }

      // Execute local action and send to backend
      if (localAction && inputChanges) {
        localAction();

        // Send input to backend
        if (socket.connected) {
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
        } else {
          console.warn("Socket not connected, input not sent");
        }
      }
    },
    [dispatch, status]
  );

  // Set up keyboard event listeners
  useEffect(() => {
    console.log("Setting up keyboard listeners, game status:", status);

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onKey]);

  // Game control functions
  const start = useCallback(() => {
    console.log("Starting game");
    dispatch(startGame());
  }, [dispatch]);

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
