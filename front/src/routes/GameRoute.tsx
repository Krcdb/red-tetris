// src/routes/GameRoute.tsx
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import socket from "../utils/socket";
import TetrisBoard from "../components/Board";
import { calculateSpectre } from "../utils/calculateSpectre";
import type { RootState } from "../redux/store";

export default function GameRoute() {
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();

  // Grab the current board and how many lines were cleared
  const board = useSelector((s: RootState) => s.game.board);
  const linesCleared = useSelector((s: RootState) => s.game.linesCleared);

  // Listen for lobby events
  useEffect(() => {
    socket.on("match:playerHasJoin", (p) =>
      console.log(p.name, "joined the game")
    );
    socket.on("match:playerHasLeft", (p) =>
      console.log(p.name, "left the game")
    );

    return () => {
      socket.off("match:playerHasJoin");
      socket.off("match:playerHasLeft");
    };
  }, []);

  // **Emit** whenever linesCleared > 0 *after* your reducer has run
  useEffect(() => {
    if (linesCleared > 0 && room && playerName) {
      const spectre = calculateSpectre(board);
      socket.emit("match:update", {
        player: { name: playerName },
        room,
        clearedLines: linesCleared,
        spectre,
      });
    }
  }, [linesCleared, board, room, playerName]);

  return <TetrisBoard room={room!} playerName={playerName!} socket={socket} />;
}
