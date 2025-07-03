import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  startGame,

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

        
      </div>

      <div>
        <GameInfo />
      </div>
    </div>
  );
}
