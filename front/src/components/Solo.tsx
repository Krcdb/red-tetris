import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { startGame } from "../redux/gameSlice";
import { RootState } from "../redux/store";
import GameInfo from "./GameInfo";
import GameOverModal from "./GameOverModal";
import { useNavigate } from "react-router-dom";

export default function Solo() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, score, linesCleared } = useSelector((state: RootState) => state.game);

  const startNewGameSolo = useCallback(() => {
    dispatch(startGame({ gameMode: "solo" }));
  }, [dispatch]);

  return (
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
      <div>
        <h1>Solo Tetris</h1>

        {status === "idle" && (
          <div>
            <h2>Press SPACE to start!</h2>
            <button onClick={startNewGameSolo}>Start Game</button>
          </div>
        )}

        {status === "gameOver" && <GameOverModal score={score} lines={linesCleared} onExit={() => navigate("/")} />}
      </div>

      <div>
        <GameInfo />
      </div>
    </div>
  );
}
