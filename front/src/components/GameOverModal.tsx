import React from "react";
import "./GameOverModal.css";

interface GameOverModalProps {
  onExit: () => void;
  score: number;
  lines: number;
  isMultiplayer?: boolean;
  onReturnToLobby?: () => void;
}

export default function GameOverModal({
  onExit,
  onReturnToLobby,
  score,
  lines,
  isMultiplayer = false,
}: GameOverModalProps) {
  return (
    <div className="modal-overlay">
      <div className="gameover-modal">
        <h1>🕹️ Game Over</h1>
        <p>Score: {score}</p>
        <p>Lines: {lines}</p>
        <div className="modal-buttons">
          {isMultiplayer && onReturnToLobby && (
            <button onClick={onReturnToLobby}>🔄 Return to Lobby</button>
          )}
          <button onClick={onExit}>🏠 Exit to Home</button>
        </div>
      </div>
    </div>
  );
}
