import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { startGame, pauseGame, resumeGame } from "../redux/gameSlice";
import { useLocalGame } from "../hooks/useLocalGame";
import Board from "./Board";
import { NextPiecePreview } from "./NextPiecePreview";

const Solo: React.FC = () => {
  const dispatch = useDispatch();
  const status = useSelector((s: RootState) => s.game.status);
  const score = useSelector((s: RootState) => s.game.score);
  useLocalGame();

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
          ) : (
            <button onClick={() => dispatch(resumeGame())}>Resume</button>
          )}
        </div>
        <div style={{ marginBottom: "1rem" }}>Score: {score}</div>
        <Board />
      </div>

      {/* Next-piece preview to the side */}
      <div>
        <h4>Next</h4>
        <NextPiecePreview />
      </div>
    </div>
  );

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      {status === "idle" && (
        <button onClick={() => dispatch(startGame())}>Start Solo Game</button>
      )}
      {(status === "playing" || status === "paused") && renderGameUI()}
      {status === "gameover" && <div>Game Over</div>}
    </div>
  );
};

export default Solo;
