import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import type { Piece } from "../utils/tetris";
import "./Board.css";

interface BoardProps {
  room?: string;
  playerName?: string;
  socket?: any;
}

const Board: React.FC<BoardProps> = ({ room, playerName, socket }) => {
  const board = useSelector((s: RootState) => s.game.board);
  const currentPiece = useSelector(
    (s: RootState) => s.game.currentPiece
  ) as Piece | null;

  return (
    <div className="board">
      {board.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          let displayCell = cell;

          if (currentPiece) {
            const { shape, x: px, y: py } = currentPiece;
            const relY = rowIdx - py;
            const relX = colIdx - px;

            if (
              relY >= 0 &&
              relY < shape.length &&
              relX >= 0 &&
              relX < shape[0].length &&
              shape[relY][relX] !== 0
            ) {
              displayCell = shape[relY][relX];
            }
          }

          return (
            <div
              key={`${rowIdx}-${colIdx}`}
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
