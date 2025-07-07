import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import "./GameRoute.css";

import {
  setGameConfig,
  gameSetup,
  gameStarted,
  updateGameState,
} from "../redux/gameSlice";
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

    dispatch(setGameConfig({ room, playerName, gameMode: "multiplayer" }));

    socketService.initialize();

    socketService.socket.on("game:isSetup", () => {
      console.log("🔧 GameRoute: Game is setup, sending player ready");
      dispatch(gameSetup());
      socketService.playerReady();
    });

    socketService.socket.on("game:isLaunching", () => {
      console.log("🚀 GameRoute: Game is launching!");
      dispatch(gameStarted());
    });

    socketService.socket.on("game:newState", (gameState) => {
      console.log("📤 GameRoute: Received game state:", gameState);
      dispatch(updateGameState(gameState));
    });

    return () => {
      console.log("🧹 GameRoute: Cleaning up");
      socketService.socket.off("game:isSetup");
      socketService.socket.off("game:isLaunching");
      socketService.socket.off("game:newState");
    };
  }, [room, playerName, dispatch, navigate]);

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

        {/*  DEBUG INFO */}
        <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
          <p>Status: {status}</p>
          <p>
            Socket connected: {socketService.socket.connected ? "Yes" : "No"}
          </p>
          <button
            onClick={() => {
              console.log("🔘 Manual ready trigger");
              if (playerName && room) {
                socketService.playerReady();
              }
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
          onExit={() => navigate("/")}
        />
      )}
    </div>
  );
}
