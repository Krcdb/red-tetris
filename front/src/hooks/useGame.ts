import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import {
  movePiece,
  rotatePiece,
  softDrop,
  hardDrop,
  startGame,
} from "../redux/gameSlice";
import { useSocket } from "./useSocket";

export function useGame() {
  const socket = useSocket();
  const status = useSelector((s: RootState) => s.game.status);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (status !== "playing") return;
      switch (e.key) {
        case "ArrowLeft":
          socket.emit("playerMove", { type: "move", dx: -1, dy: 0 });
          break;
        case "ArrowRight":
          socket.emit("playerMove", { type: "move", dx: 1, dy: 0 });
          break;
        case "ArrowUp":
          socket.emit("playerMove", { type: "rotate" });
          break;
        case "ArrowDown":
          socket.emit("playerMove", { type: "softDrop" });
          break;
        case " ":
          socket.emit("playerMove", { type: "hardDrop" });
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, socket]);
}
