import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { renderBoardWithPiece, getCellColor } from "../utils/tetris";
import "./GameBoard.css";
import { validateGameMode } from "../utils/gameMode";

export default function GameBoard() {
  const { board, currentPiece } = useSelector((state: RootState) => state.game);

  const rawGameMode = sessionStorage.getItem("selectedGameMode") || "normal";
  const gameMode = validateGameMode(rawGameMode);

  const displayBoard = renderBoardWithPiece(board, currentPiece);

  const isCurrentPiece = (x: number, y: number) => {
    if (!currentPiece) return false;

    for (let py = 0; py < currentPiece.shape.length; py++) {
      for (let px = 0; px < currentPiece.shape[py].length; px++) {
        if (currentPiece.shape[py][px] !== 0) {
          if (currentPiece.x + px === x && currentPiece.y + py === y) {
            return true;
          }
        }
      }
    }
    return false;
  };

  return (
    <div className="game-board">
      {displayBoard.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className={`cell ${cell !== 0 ? "filled" : "empty"}`}
            style={{
              backgroundColor:
                gameMode === "invisible" && cell !== 0 && !isCurrentPiece(x, y)
                  ? "#111" // Hide placed pieces in invisible mode
                  : getCellColor(cell),
            }}
          />
        ))
      )}
    </div>
  );
}
