import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { formatScore } from "../utils/tetris";
import "./GameInfo.css";
import { validateGameMode } from "../utils/gameMode";

function NextPiecePreview({ nextPieces }: { nextPieces: any[] }) {
  const rawGameMode = sessionStorage.getItem("selectedGameMode") || "normal";
  const gameMode = validateGameMode(rawGameMode);

  // Hide preview in no-preview mode
  if (gameMode === "no-preview") {
    return (
      <div className="next-piece-preview">
        <h4>Next</h4>
        <div className="next-piece" style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          ???
        </div>
      </div>
    );
  }

  const next = nextPieces[0];
  if (!next) return null;
  return (
    <div className="next-piece-preview">
      <h4>Next</h4>
      <div className="next-piece">
        {next.shape.map((row: number[], y: number) => (
          <div key={y} style={{ display: "flex" }}>
            {row.map((cell: number, x: number) => (
              <div
                key={x}
                style={{
                  width: 16,
                  height: 16,
                  background: cell ? "#888" : "transparent",
                  border: cell ? "1px solid #333" : "1px solid transparent",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GameInfo() {
  const { playerName, gamers, score, linesCleared, level, opponents, status } = useSelector(
    (state: RootState) => state.game
  );

  const currentGamer = gamers?.find((g: any) => g.name === playerName);
  const nextPieces = currentGamer?.nextPieces || [];

  return (
    <div className="game-info">
      <div className="player-stats">
        <h3>Your Stats</h3>
        <p>Score: {formatScore(score)}</p>
        <p>Lines: {linesCleared}</p>
        <p>Level: {level}</p>
        <p>Status: {status}</p>
      </div>
      <NextPiecePreview nextPieces={nextPieces} />

      {opponents.length > 0 && (
        <div className="opponents-section">
          <h3>Opponents</h3>
          {opponents.map((opponent) => (
            <div key={opponent.name} className="opponent-card">
              <h4>{opponent.name}</h4>
              <p>Score: {formatScore(opponent.score)}</p>
              <p>Lines: {opponent.linesCleared}</p>

              <div className="mini-board">
                {opponent.board.map((row, y) =>
                  row.map((cell, x) => (
                    <div key={`${x}-${y}`} className={`mini-cell ${cell !== 0 ? "filled" : "empty"}`} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
