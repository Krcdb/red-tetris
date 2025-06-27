import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import {
  startGame,
  pauseGame,
  resumeGame,
  setPieces,
  updateBoard,
} from "../redux/gameSlice";
import { useGame } from "../hooks/useGame";
import socket from "../utils/socket";
import Board from "./Board";
import { useNavigate } from "react-router-dom";

const Solo: React.FC = () => {
  const dispatch = useDispatch();
  const { status, score, nextPieces } = useSelector((s: RootState) => s.game);
  const [soloRoom, setSoloRoom] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const navigate = useNavigate();

  useGame();

  useEffect(() => {
    socket.on("game:isSetup", () => {
      console.log("Solo game setup - sending ready");
      socket.emit("game:playerReady");
    });

    socket.on("game:isLaunching", () => {
      console.log("Solo game launching");
      dispatch(startGame({ gameMode: "solo" }));
    });

    socket.on("game:newState", (gameState) => {
      console.log("Solo game state received:", gameState);

      const playerData = gameState.gamers?.[0];
      if (playerData) {
        dispatch(
          setPieces({
            currentPiece: playerData.currentPiece,
            nextPieces: gameState.nextPieces || [],
          })
        );
        if (playerData.grid) {
          console.log(
            "📋 Solo: Updating board with locked pieces:",
            playerData.grid
          );
          dispatch(updateBoard(playerData.grid));
        }
      }
    });

    // Cleanup function - only disconnect if we have an active solo room
    return () => {
      if (soloRoom && playerName) {
        console.log("Solo cleanup - leaving room:", soloRoom);
        socket.emit("match:playerLeft", { playerName, room: soloRoom });
      }
      socket.off("game:isSetup");
      socket.off("game:isLaunching");
      socket.off("game:newState");
    };
  }, [dispatch, soloRoom, playerName]);

  const handleStartSolo = () => {
    const newSoloRoom = `solo_${Date.now()}`;
    const newPlayerName = `player_${Date.now()}`;

    console.log("Starting solo game:", { newSoloRoom, newPlayerName });

    // Set state first to prevent cleanup issues
    setSoloRoom(newSoloRoom);
    setPlayerName(newPlayerName);

    // Then join and start
    socket.emit("match:playerJoin", {
      playerName: newPlayerName,
      room: newSoloRoom,
    });

    // Small delay to ensure join is processed before starting
    setTimeout(() => {
      socket.emit("match:startGame", { room: newSoloRoom });
    }, 100);
  };

  const renderGameUI = () => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "2rem",
        justifyContent: "center",
      }}
    >
      <div>
        <div style={{ marginBottom: "1rem" }}>
          {status === "playing" ? (
            <button onClick={() => dispatch(pauseGame())}>Pause</button>
          ) : status === "paused" ? (
            <button onClick={() => dispatch(resumeGame())}>Resume</button>
          ) : null}
        </div>
        <div style={{ marginBottom: "1rem" }}>Score: {score}</div>
        <Board />
      </div>

      <div>
        <h4>Next Pieces</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {nextPieces.slice(0, 3).map((piece, index) => (
            <div
              key={index}
              style={{ border: "1px solid #333", padding: "5px" }}
            >
              <div style={{ fontSize: "10px" }}>Next {index + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h1>Solo Game</h1>

      {status === "idle" && (
        <button onClick={handleStartSolo}>Start Solo Game</button>
      )}

      {(status === "playing" || status === "paused") && renderGameUI()}

      {status === "gameover" && (
        <div>
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <button onClick={() => navigate("/")}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default Solo;
