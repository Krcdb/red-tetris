import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !name) return;
    navigate(`/${encodeURIComponent(room)}/${encodeURIComponent(name)}`);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h1>🔴 Red Tetris</h1>
      <form onSubmit={onSubmit}>
        <input
          placeholder="Room name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Join / Create Game</button>
      </form>
    </div>
  );
};

export default Home;
