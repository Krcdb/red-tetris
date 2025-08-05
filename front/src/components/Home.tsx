import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetGame } from "../redux/gameSlice";
import { resetLobby } from "../redux/lobbySlice";
import { socketService } from "../services/socketService";
import "./Home.css";
import {
  validateGameMode,
  getGameModeDisplay,
  VALID_GAME_MODES,
  GAME_MODE_INFO,
  GameMode,
} from "../utils/gameMode";

const Home: React.FC = () => {
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>("normal");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log("🏠 Home: Component mounted, ensuring clean state");

    dispatch(resetGame());
    dispatch(resetLobby());

    sessionStorage.clear();

    socketService.resetForHome();

    setTimeout(() => {
      console.log("🏠 Home: Cleanup complete, ready for new game");
    }, 200);
  }, [dispatch]);

  const gameModes = Object.values(GAME_MODE_INFO);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !name) return;

    const validMode = validateGameMode(selectedGameMode);

    navigate(
      `/${encodeURIComponent(room)}/${encodeURIComponent(
        name
      )}?mode=${validMode}`
    );
  };

  const handleGameModeChange = (mode: string) => {
    const validMode = validateGameMode(mode);
    setSelectedGameMode(validMode);
  };

  return (
    <div className="retro-container">
      <h1 className="retro-title">Red Tetris</h1>
      <form className="retro-form" onSubmit={onSubmit}>
        <input
          className="retro-input"
          placeholder="Room name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <input
          className="retro-input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="game-mode-section">
          <h3 className="mode-title">Choose Game Mode:</h3>
          <div className="game-modes">
            {gameModes.map((mode) => (
              <div
                key={mode.id}
                className={`game-mode-option ${
                  selectedGameMode === mode.id ? "selected" : ""
                }`}
                onClick={() => handleGameModeChange(mode.id)}
              >
                <div className="mode-name">{mode.name}</div>
                <div className="mode-description">{mode.description}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="retro-button" type="submit">
          Join / Create Game
        </button>
      </form>
    </div>
  );
};

export default Home;
