import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { socketService } from "../services/socketService";
import "./GameControls.css";

export default function GameControls() {
  const { status, playerName, room } = useSelector(
    (state: RootState) => state.game
  );
  const keysPressed = useRef<Set<string>>(new Set());
  const inputRef = useRef({
    up: false,
    left: false,
    right: false,
    down: false,
    space: false,
    spaceHasBeenCounted: false,
    upHasBeenCounted: false,
  });

  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      socketService.sendInput(inputRef.current);
    }, 50); // Send input every 50ms

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (keysPressed.current.has(e.code)) return;
      keysPressed.current.add(e.code);

      switch (e.code) {
        case "ArrowLeft":
          inputRef.current.left = true;
          break;
        case "ArrowRight":
          inputRef.current.right = true;
          break;
        case "ArrowDown":
          inputRef.current.down = true;
          break;
        case "ArrowUp":
          inputRef.current.up = true;
          inputRef.current.upHasBeenCounted = false;
          break;
        case "Space":
          e.preventDefault();
          inputRef.current.space = true;
          inputRef.current.spaceHasBeenCounted = false;
          break;
      }

      // socketService.sendInput(inputRef.current);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);

      switch (e.code) {
        case "ArrowLeft":
          inputRef.current.left = false;
          break;
        case "ArrowRight":
          inputRef.current.right = false;
          break;
        case "ArrowDown":
          inputRef.current.down = false;
          break;
        case "ArrowUp":
          inputRef.current.up = false;
          break;
        case "Space":
          inputRef.current.space = false;
          break;
      }

      // socketService.sendInput(inputRef.current);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [status]);

  return (
    <div className="game-controls">
      <h4>Controls:</h4>
      <ul className="controls-list">
        <li>← → : Move left/right</li>
        <li>↓ : Soft drop</li>
        <li>↑ : Rotate</li>
        <li>Space : Hard drop</li>
      </ul>

      {status === "idle" && (
        <button
          className="ready-button"
          onClick={() => socketService.playerReady()}
        >
          Ready to Play
        </button>
      )}

      <div className={`status-indicator status-${status}`}>
        Status: {status.toUpperCase()}
      </div>
    </div>
  );
}
