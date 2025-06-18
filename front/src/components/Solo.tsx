import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { startGame } from "../redux/gameSlice";
import { useLocalGame } from "../hooks/useLocalGame";
import Board from "./Board";

const Solo: React.FC = () => {
  const dispatch = useDispatch();
  const status = useSelector((s: RootState) => s.game.status);
  useLocalGame();

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      {status === "idle" && (
        <button onClick={() => dispatch(startGame())}>Start Solo Game</button>
      )}
      {status === "playing" && <Board />}
      {status === "gameover" && <div>Game Over</div>}
    </div>
  );
};

export default Solo;
