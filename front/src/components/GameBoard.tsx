import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { renderBoardWithPiece, getCellColor } from "../utils/tetris";
import "./GameBoard.css";

export default function GameBoard() {
  const { board, currentPiece } = useSelector((state: RootState) => state.game);

  const displayBoard = renderBoardWithPiece(board, currentPiece);

  return (
    <div className="game-board">
      {displayBoard.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className={`cell ${cell !== 0 ? "filled" : "empty"}`}
            style={{
              backgroundColor: getCellColor(cell),
            }}
          />
        ))
      )}
    </div>
  );
}
