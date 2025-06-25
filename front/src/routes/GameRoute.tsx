import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "../hooks/useGame";
import { useDispatch } from "react-redux";
import { setPieces } from "../redux/gameSlice"; // Remove setNextPiece and updatePlayerState imports
import socket from "../utils/socket";
import Board from "../components/Board";

export default function GameRoute() {
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();

  const { status, currentPiece, board, start } = useGame();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!room || !playerName) return;

    console.log("🎮 GameRoute: Setting up game events", {
      room,
      playerName,
      socketConnected: socket.connected,
    });

    // Join the room for game
    console.log("📤 Emitting match:playerJoin", { playerName, room });
    socket.emit("match:playerJoin", { playerName, room });

    // Game event handlers
    socket.on("game:isSetup", () => {
      console.log("🔧 Game is being set up - sending player ready");
      console.log("📤 Emitting game:playerReady");
      socket.emit("game:playerReady");
    });

    socket.on("game:isLaunching", () => {
      console.log("🚀 Game is launching!");
      start("multiplayer");
    });

    socket.on("game:newState", (gameState) => {
      console.log("📡 Received new game state from backend:");
      console.log("  Room:", gameState.room);
      console.log("  Current Piece Index:", gameState.currentPieceIndex);
      console.log(
        "  Next Pieces:",
        gameState.nextPieces?.map((p: any) => p.type).join(", ")
      );

      gameState.gamers?.forEach((gamer: any, index: number) => {
        console.log(`  Player ${index + 1} (${gamer.name}):`);
        console.log(
          `    Current Piece: ${gamer.currentPiece?.type} at (${gamer.currentPiece?.x}, ${gamer.currentPiece?.y})`
        );
        console.log(`    Score: ${gamer.score}, Lines: ${gamer.linesCleared}`);
      });

      const currentPlayerData = gameState.gamers?.find(
        (g: any) => g.name === playerName
      );

      if (currentPlayerData) {
        dispatch(
          setPieces({
            currentPiece: currentPlayerData.currentPiece,
            nextPieces: gameState.nextPieces || [],
          })
        );
      }
    });

    // Add logging for any socket errors
    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    return () => {
      console.log("🧹 Cleaning up GameRoute socket events");
      socket.off("game:isSetup");
      socket.off("game:isLaunching");
      socket.off("game:newState");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, [room, playerName, start, dispatch]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Game: {room}</h1>
      <p>Player: {playerName}</p>
      <p>Status: {status}</p>
      <p>Socket Connected: {socket.connected ? "Yes" : "No"}</p>

      {status === "idle" && (
        <div>
          <p>Waiting for game to start...</p>
          <button
            onClick={() => {
              console.log("🔘 Manual start game button clicked");
              socket.emit("match:startGame", { room });
            }}
          >
            🚀 Start Game Manually
          </button>
        </div>
      )}

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
