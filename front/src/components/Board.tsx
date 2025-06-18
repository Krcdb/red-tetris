import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { GamePiece } from "../redux/gameSlice";
import "./Board.css";

const Board: React.FC = () => {
  const board = useSelector((s: RootState) => s.game.board);
  const currentPiece = useSelector((s: RootState) => s.game.currentPiece);

  return (
    <div className="board">
      {board.map((row, y) =>
        row.map((cell, x) => {
          let displayCell = cell;

          if (currentPiece) {
            const { shape, x: px, y: py } = currentPiece;
            const dy = y - py;
            const dx = x - px;
            if (
              dy >= 0 &&
              dy < shape.length &&
              dx >= 0 &&
              dx < shape[0].length &&
              shape[dy][dx] !== 0
            ) {
              displayCell = shape[dy][dx];
            }
          }

          return (
            <div
              key={`${y}-${x}`}
              className="cell"
              style={{
                backgroundColor: displayCell === 0 ? "#222" : "#f44",
              }}
            />
          );
        })
      )}
    </div>
  );
};

export default Board;
