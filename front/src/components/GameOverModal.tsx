import React from "react";
import "./GameOverModal.css";

interface GameOverModalProps {
  onExit: () => void;
  score: number;
  lines: number;
}

export default function GameOverModal({
  onExit,
  score,
  lines,
}: GameOverModalProps) {
  return (
    <div className="modal-overlay">
      <div className="gameover-modal">
        <h1>🕹️ Game Over</h1>
        <p>Score: {score}</p>
        <p>Lines: {lines}</p>
        <div className="modal-buttons">
          <button onClick={onExit}>🏠 Exit</button>
        </div>
      </div>
    </div>
  );
}
