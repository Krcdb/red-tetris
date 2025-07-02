// import { useEffect, useCallback, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import type { RootState, AppDispatch } from "../redux/store";
// import {
//   startGame,
//   pauseGame,
//   resumeGame,
//   clearNeedsNextPiece,
//   movePiece,
//   rotatePiece,
// } from "../redux/gameSlice";
// import socket from "../utils/socket";
// import { sendPlayerInput } from "../redux/socketThunks";

// export function useGame() {
//   const dispatch = useDispatch<AppDispatch>();
//   const { status, currentPiece, board, needsNextPiece, nextPieces } =
//     useSelector((state: RootState) => state.game);

//   useEffect(() => {
//     if (needsNextPiece && socket.connected) {
//       console.log("Requesting next piece from server");
//       socket.emit("game:pieceLanded");
//       dispatch(clearNeedsNextPiece());
//     }
//   }, [needsNextPiece, dispatch]);

//   const onKey = useCallback(
//     (e: KeyboardEvent) => {
//       console.log("keydown event fired:", e.code, e.key);

//       if (status !== "playing") return;

//       const key = e.key.toLowerCase();
//       let inputChanges: any = null;

//       if (
//         ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(
//           e.code
//         ) ||
//         ["a", "d", "w", "s"].includes(key)
//       ) {
//         e.preventDefault();
//       }

//       if (e.code === "ArrowLeft" || key === "a") {
//         inputChanges = { left: true };
//       } else if (e.code === "ArrowRight" || key === "d") {
//         inputChanges = { right: true };
//       } else if (e.code === "ArrowUp" || key === "w") {
//         inputChanges = { up: true, upHasBeenCounted: false };
//       } else if (e.code === "ArrowDown" || key === "s") {
//         inputChanges = { down: true };
//       } else if (e.code === "Space") {
//         inputChanges = { space: true, spaceHasBeenCounted: false };
//       }

//       if (inputChanges && socket.connected) {
//         dispatch(
//           sendPlayerInput({
//             up: false,
//             left: false,
//             right: false,
//             down: false,
//             space: false,
//             spaceHasBeenCounted: false,
//             upHasBeenCounted: false,
//             ...inputChanges,
//           })
//         );
//       }
//     },
//     [status, dispatch]
//   );

//   const inputTimeoutRef = useRef<NodeJS.Timeout>();

//   useEffect(() => {
//     return () => {
//       if (inputTimeoutRef.current) {
//         clearTimeout(inputTimeoutRef.current);
//       }
//     };
//   }, []);

//   useEffect(() => {
//     console.log("Setting up keyboard listeners, game status:", status);
//     document.addEventListener("keydown", onKey);
//     return () => {
//       document.removeEventListener("keydown", onKey);
//     };
//   }, [onKey]);

//   const start = useCallback(
//     (gameMode?: "solo" | "multiplayer") => {
//       console.log("Starting game with mode:", gameMode);
//       dispatch(startGame({ gameMode: gameMode || "solo" }));
//     },
//     [dispatch]
//   );

//   const pause = useCallback(() => {
//     console.log("Pausing game");
//     dispatch(pauseGame());
//   }, [dispatch]);

//   const resume = useCallback(() => {
//     console.log("Resuming game");
//     dispatch(resumeGame());
//   }, [dispatch]);

//   return {
//     status,
//     currentPiece,
//     board,
//     start,
//     pause,
//     resume,
//     nextPieces,
//   };
// }
