import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetGame } from "../redux/gameSlice";
import { resetLobby } from "../redux/lobbySlice";
import { socketService } from "../services/socketService";
import "./Home.css";
import { validateGameMode, GAME_MODE_INFO, GameMode } from "../utils/gameMode";

const NAME_MAX_LENGTH = 16;
// Reject only chars that break URL paths or are non-printable.
// Everything else (accents, spaces, apostrophes, kanji, emoji, …) is fine.
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARS = /[/\\?#\x00-\x1F\x7F]/;

const Home: React.FC = () => {
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>("normal");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(resetGame());
    dispatch(resetLobby());

    sessionStorage.clear();

    socketService.resetForHome();
  }, [dispatch]);

  const gameModes = Object.values(GAME_MODE_INFO);

  const validateField = (label: string, value: string): string | null => {
    if (!value) return `Please enter ${label}.`;
    const capitalized = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
    if (value.length > NAME_MAX_LENGTH) {
      return `${capitalized} must be ${String(NAME_MAX_LENGTH)} characters or fewer.`;
    }
    if (FORBIDDEN_CHARS.test(value)) {
      return `${capitalized} cannot contain / \\ ? # or control characters.`;
    }
    return null;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedRoom = room.trim();
    const trimmedName = name.trim();

    const roomError = validateField("a room name", trimmedRoom);
    if (roomError) {
      setFormError(roomError);
      return;
    }
    const nameError = validateField("your name", trimmedName);
    if (nameError) {
      setFormError(nameError);
      return;
    }

    setFormError(null);
    const validMode = validateGameMode(selectedGameMode);

    navigate(`/${encodeURIComponent(trimmedRoom)}/${encodeURIComponent(trimmedName)}?mode=${validMode}`);
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
          maxLength={NAME_MAX_LENGTH}
          onChange={(e) => {
            setRoom(e.target.value);
            if (formError) setFormError(null);
          }}
        />
        <input
          className="retro-input"
          placeholder="Your name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          onChange={(e) => {
            setName(e.target.value);
            if (formError) setFormError(null);
          }}
        />
        <p className="input-hint">Max {NAME_MAX_LENGTH} chars. Avoid / \ ? #.</p>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="game-mode-section">
          <h3 className="mode-title">Choose Game Mode:</h3>
          <div className="game-modes">
            {gameModes.map((mode) => (
              <div
                key={mode.id}
                className={`game-mode-option ${selectedGameMode === mode.id ? "selected" : ""}`}
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

        <p className="solo-hint">
          Tip: to play alone, create a room and click Start while you're the only player.
        </p>
      </form>
    </div>
  );
};

export default Home;
