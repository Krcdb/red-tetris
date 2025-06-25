import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import {
  startGame,
  pauseGame,
  resumeGame,
  setPieces,
} from "../redux/gameSlice";
import { useGame } from "../hooks/useGame";
import socket from "../utils/socket";
import Board from "./Board";

const Solo: React.FC = () => {
  const dispatch = useDispatch();
  const { status, score, nextPieces } = useSelector((s: RootState) => s.game);

  // Remove the useGame hook here since we're managing start manually
  useGame(); // Still need this for keyboard controls and auto-drop

  useEffect(() => {
    // Set up socket events for solo game
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

      // For solo, we're the only player
      const playerData = gameState.gamers?.[0];
      if (playerData) {
        dispatch(
          setPieces({
            currentPiece: playerData.currentPiece,
            nextPieces: gameState.nextPieces || [],
          })
        );
      }
    });

    return () => {
      socket.off("game:isSetup");
      socket.off("game:isLaunching");
      socket.off("game:newState");
    };
  }, [dispatch]);

  const handleStartSolo = () => {
    // Create unique room and player names
    const soloRoom = `solo_${Date.now()}`;
    const playerName = `player_${Date.now()}`;

    console.log("Starting solo game:", { soloRoom, playerName });

    // Join the room
    socket.emit("match:playerJoin", { playerName, room: soloRoom });

    // Start the game (this triggers the backend to launch the game)
    socket.emit("match:startGame", { room: soloRoom });
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
              {/* You could render actual piece preview here */}
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
          <button onClick={handleStartSolo}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default Solo;
