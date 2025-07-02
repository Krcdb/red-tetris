import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  startGame,
  pauseGame,
  resumeGame,
  setPieces,
  updateBoard,
  gameOver,
} from "../redux/gameSlice";
import { RootState } from "../redux/store";
import GameBoard from "./GameBoard";
import GameInfo from "./GameInfo";
import GameControls from "./GameControls";

export default function Solo() {
  const dispatch = useDispatch();
  const { status, score, linesCleared, level } = useSelector(
    (state: RootState) => state.game
  );

  const startNewGame = useCallback(() => {
    dispatch(startGame({ gameMode: "solo" }));
  }, [dispatch]);

  const togglePause = useCallback(() => {
    if (status === "playing") {
      dispatch(pauseGame());
    } else if (status === "paused") {
      dispatch(resumeGame());
    }
  }, [status, dispatch]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space" && status !== "playing") {
        event.preventDefault();
        if (status === "idle" || status === "gameOver") {
          startNewGame();
        } else {
          togglePause();
        }
      }
      if (event.code === "Escape") {
        togglePause();
      }
    },
    [status, startNewGame, togglePause]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
      <div>
        <h1>Solo Tetris</h1>

        {status === "idle" && (
          <div>
            <h2>Press SPACE to start!</h2>
            <button onClick={startNewGame}>Start Game</button>
          </div>
        )}

        {status === "gameOver" && (
          <div>
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
            <p>Lines Cleared: {linesCleared}</p>
            <button onClick={startNewGame}>Play Again</button>
          </div>
        )}

        {(status === "playing" || status === "paused") && (
          <>
            <GameBoard />
            <GameControls />
            {status === "paused" && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(0,0,0,0.8)",
                  color: "white",
                  padding: "20px",
                  borderRadius: "10px",
                }}
              >
                <h2>PAUSED</h2>
                <p>Press ESC or click to resume</p>
                <button onClick={togglePause}>Resume</button>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <GameInfo />
      </div>
    </div>
  );
}
