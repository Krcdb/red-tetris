import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "../hooks/useGame";
import socket from "../utils/socket";
import Board from "../components/Board";

export default function GameRoute() {
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();

  const { status, currentPiece, board, start } = useGame();

  useEffect(() => {
    if (!room || !playerName) return;

    console.log("GameRoute: Setting up game events", {
      room,
      playerName,
      socketConnected: socket.connected,
    });

    // Join the room for game
    socket.emit("match:playerJoin", { playerName, room });

    // Game event handlers
    socket.on("game:isSetup", () => {
      console.log("Game is being set up - sending player ready");
      socket.emit("game:playerReady");
    });

    socket.on("game:isLaunching", () => {
      console.log("Game is launching!");
      start();
    });

    socket.on("game:newState", (gameState) => {
      console.log("Received new game state from backend:", gameState);
    });

    // TEMPORARY DEBUG: Force send ready signal after a short delay
    const debugTimer = setTimeout(() => {
      console.log("DEBUG: Force sending game:playerReady for", playerName);
      socket.emit("game:playerReady");
    }, 1000);

    return () => {
      clearTimeout(debugTimer);
      socket.off("game:isSetup");
      socket.off("game:isLaunching");
      socket.off("game:newState");
    };
  }, [room, playerName, start]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Game: {room}</h1>
      <p>Player: {playerName}</p>
      <p>Status: {status}</p>
      <p>Socket Connected: {socket.connected ? "Yes" : "No"}</p>

      {status === "idle" && <p>Waiting for game to start...</p>}

      <div>
        <button
          onClick={() => {
            console.log("Manual ready send");
            socket.emit("game:playerReady");
          }}
        >
          Send Ready Signal (Debug)
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        <div>
          <Board />
        </div>
        <div>
          <h3>Controls:</h3>
          <p>Arrow Keys or WASD to move</p>
          <p>Space to hard drop</p>
        </div>
      </div>
    </div>
  );
}
