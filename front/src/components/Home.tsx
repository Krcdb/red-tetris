import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetGame } from "../redux/gameSlice";
import { resetLobby } from "../redux/lobbySlice";
import { socketService } from "../services/socketService";
import "./Home.css";

const Home: React.FC = () => {
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Ensure clean state when Home component mounts
  useEffect(() => {
    console.log("🏠 Home: Component mounted, ensuring clean state");
    dispatch(resetGame());
    dispatch(resetLobby());

    // Reinitialize socket service for fresh connections
    if (socketService.socket.connected) {
      socketService.cleanup();
    }
  }, [dispatch]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !name) return;
    navigate(`/${encodeURIComponent(room)}/${encodeURIComponent(name)}`);
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
        <button className="retro-button" type="submit">
          Join / Create Game
        </button>
      </form>
    </div>
  );
};

export default Home;
