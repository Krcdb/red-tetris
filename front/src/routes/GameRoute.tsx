import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import socket from "../utils/socket";
import Board from "../components/Board";
import { NextPiecePreview } from "../components/NextPiecePreview";
import { useGame } from "../hooks/useGame";
import type { RootState } from "../redux/store";
import { startGame, pauseGame, resumeGame } from "../redux/gameSlice";

export default function GameRoute() {
  const dispatch = useDispatch();
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();

  useGame();

  const status = useSelector((s: RootState) => s.game.status);
  const score = useSelector((s: RootState) => s.game.score);

  useEffect(() => {
    if (!room || !playerName) return;

    socket.connect();
    socket.emit("match:playerJoin", {
      player: { name: playerName },
      room,
    });

    dispatch(startGame());

    return () => {
      socket.emit("match:playerLeft", {
        player: { name: playerName },
        room,
      });
      socket.disconnect();
    };
  }, [dispatch, room, playerName]);

  const renderGameUI = () => (
    <div style={{ display: "flex", justifyContent: "center", gap: "2rem" }}>
      <div>
        <Board room={room!} playerName={playerName!} socket={socket} />
      </div>
      <div>
        <h3>Score: {score}</h3>
        <h3>Next</h3>
        <NextPiecePreview />
        {status === "playing" && (
          <button onClick={() => dispatch(pauseGame())}>Pause</button>
        )}
        {status === "paused" && (
          <button onClick={() => dispatch(resumeGame())}>Resume</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      {status === "idle" && (
        <button onClick={() => dispatch(startGame())}>Start Game</button>
      )}
      {(status === "playing" || status === "paused") && renderGameUI()}
      {status === "gameover" && <div>Game Over</div>}
    </div>
  );
}
