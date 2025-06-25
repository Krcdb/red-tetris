import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import {
  startGame,
  movePiece,
  rotatePiece,
  softDrop,
  hardDrop,
  endGame,
} from "../redux/gameSlice";

export function useLocalGame() {
  const dispatch = useDispatch<AppDispatch>();
  const { status } = useSelector((s: RootState) => s.game);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (status !== "playing") return;
    timerRef.current = setInterval(() => {
      dispatch(softDrop());
    }, 500);
    return () => clearInterval(timerRef.current);
  }, [status, dispatch]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (status !== "playing") return;
      switch (e.key) {
        case "ArrowLeft":
          dispatch(movePiece({ dx: -1, dy: 0 }));
          break;
        case "ArrowRight":
          dispatch(movePiece({ dx: 1, dy: 0 }));
          break;
        case "ArrowUp":
          dispatch(rotatePiece());
          break;
        case "ArrowDown":
          dispatch(softDrop());
          break;
        case " ":
          dispatch(hardDrop());
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, dispatch]);
}
