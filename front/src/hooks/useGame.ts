import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { movePiece, rotatePiece, softDrop, hardDrop } from "../redux/gameSlice";
import { useSocket } from "./useSocket";

export function useGame() {
  const socket = useSocket();
  const dispatch = useDispatch();
  const status = useSelector((s: RootState) => s.game.status);

  useEffect(() => {
    console.log("🔌 useGame mounted; status=", status);

    function onKey(e: KeyboardEvent) {
      console.log("keydown event fired:", e.code, e.key);
      if (status !== "playing") return;

      const key = e.key.toLowerCase();
      let localAction: (() => void) | null = null;
      let socketEvent: { type: string; dx?: number; dy?: number } | null = null;

      if (e.code === "ArrowLeft" || key === "a") {
        localAction = () => dispatch(movePiece({ dx: -1, dy: 0 }));
        socketEvent = { type: "move", dx: -1, dy: 0 };
      } else if (e.code === "ArrowRight" || key === "d") {
        localAction = () => dispatch(movePiece({ dx: 1, dy: 0 }));
        socketEvent = { type: "move", dx: 1, dy: 0 };
      } else if (e.code === "ArrowUp" || key === "w") {
        localAction = () => dispatch(rotatePiece());
        socketEvent = { type: "rotate" };
      } else if (e.code === "ArrowDown" || key === "s") {
        localAction = () => dispatch(softDrop());
        socketEvent = { type: "softDrop" };
      } else if (e.code === "Space") {
        localAction = () => dispatch(hardDrop());
        socketEvent = { type: "hardDrop" };
      }

      if (localAction) {
        localAction();
        if (socket.connected && socketEvent) {
          socket.emit("playerMove", socketEvent);
        }
        console.log("action executed:", socketEvent);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      console.log("🛑 useGame unmounted");
    };
  }, [status, socket, dispatch]);

  useEffect(() => {
    if (status !== "playing") return;
    const interval = setInterval(() => {
      dispatch(softDrop());
      if (socket.connected) {
        socket.emit("playerMove", { type: "softDrop" });
      }
    }, 500);
    return () => clearInterval(interval);
  }, [status, socket, dispatch]);
}
