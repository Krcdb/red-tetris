import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import "./GameRoute.css";

import { setGameConfig, resetGame } from "../redux/gameSlice";
import { resetLobby } from "../redux/lobbySlice";
import { socketService } from "../services/socketService";
import GameBoard from "../components/GameBoard";
import GameInfo from "../components/GameInfo";
import GameControls from "../components/GameControls";
import GameOverModal from "../components/GameOverModal";

export default function GameRoute() {
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { status, error, score, linesCleared } = useSelector(
    (state: RootState) => state.game
  );

  useEffect(() => {
    if (!room || !playerName) {
      navigate("/");
      return;
    }

    console.log("🎮 GameRoute: Setting up for", { room, playerName });

    // Set game config
    dispatch(setGameConfig({ room, playerName, gameMode: "multiplayer" }));

    // Ensure socket service is initialized
    socketService.initialize();

    // Wait a bit for socket to be ready, then send player ready
    const readyTimer = setTimeout(() => {
      console.log("🔧 GameRoute: Sending player ready after setup");
      console.log(
        "🔧 GameRoute: Socket connected:",
        socketService.socket.connected
      );
      socketService.playerReady();
    }, 200);

    return () => {
      clearTimeout(readyTimer);
      console.log("🧹 GameRoute: Component unmounting, cleaning up");
    };
  }, [room, playerName, dispatch, navigate]);

  useEffect(() => {
    if (status === "gameOver") {
      // Auto-navigate back to lobby after a delay
      const timer = setTimeout(() => {
        navigate(`/${room}/${playerName}`);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, room, playerName, navigate]);

  const handleExitToHome = () => {
    console.log("🏠 GameRoute: Exiting to home, cleaning up...");

    // Reset both game and lobby state
    dispatch(resetGame());
    dispatch(resetLobby());

    // Leave the current room if connected
    if (room && playerName) {
      socketService.leaveRoom(playerName, room);
    }

    // Clean up socket listeners
    socketService.cleanup();

    // Navigate to home
    navigate("/");
  };

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h2>Game Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(`/${room}/${playerName}`)}>
          Back to Lobby
        </button>
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Red Tetris - {room}</h2>
        <p>Player: {playerName}</p>
        <p>Waiting for game to start...</p>
        <div style={{ marginTop: "20px" }}>
          <div className="loading-spinner">⏳</div>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Connecting to game...
          </p>
        </div>

        {/* Temporary debug section - remove when working */}
        <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
          <p>Status: {status}</p>
          <p>
            Socket connected: {socketService.socket.connected ? "Yes" : "No"}
          </p>
          <p>Socket ID: {socketService.socket.id}</p>
          <button
            onClick={() => {
              console.log("🔘 Manual ready trigger");
              socketService.playerReady();
            }}
            style={{ margin: "5px", padding: "5px 10px" }}
          >
            🔄 Send Ready Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      <div className="game-container">
        <div className="left-panel">
          <GameControls />
        </div>
        <div className="center-panel">
          <h2 className="retro-title">Red Tetris - {room}</h2>
          <p>Player: {playerName}</p>
          <GameBoard />
        </div>
        <div className="right-panel">
          <GameInfo />
        </div>
      </div>
      {status === "gameOver" && (
        <GameOverModal
          score={score}
          lines={linesCleared}
          isMultiplayer={true}
          onReturnToLobby={() => navigate(`/${room}/${playerName}`)}
          onExit={handleExitToHome}
        />
      )}
    </div>
  );
}
