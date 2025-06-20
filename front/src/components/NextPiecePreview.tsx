import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { GamePiece } from "../redux/gameSlice";
import "./NextPiecePreview.css";

const GRID_SIZE = 4;

export const NextPiecePreview: React.FC = () => {
  const nextPiece: GamePiece | undefined = useSelector(
    (s: RootState) => s.game.nextPieces[0]
  );

  const previewGrid = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );

  if (nextPiece) {
    const { shape } = nextPiece;
    const offsetY = Math.floor((GRID_SIZE - shape.length) / 2);
    const offsetX = Math.floor((GRID_SIZE - shape[0].length) / 2);

    shape.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell !== 0) {
          previewGrid[offsetY + y][offsetX + x] = cell;
        }
      })
    );
  }

  return (
    <div className="next-piece-preview">
      {previewGrid.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className="preview-cell"
            style={{
              backgroundColor: cell === 0 ? "#222" : "#f44",
            }}
          />
        ))
      )}
    </div>
  );
};
