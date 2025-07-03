import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";

const Lobby: React.FC = () => {
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();
  const [players, setPlayers] = useState<string[]>([]);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (!room || !playerName) {
      navigate("/");
      return;
    }

    socket.emit("joinRoom", { room, playerName });

    socket.on("playerList", (list: string[]) => {
      setPlayers(list);
    });

    socket.on("joinDenied", () => {
      alert("Game in progress. Please try again later.");
      navigate("/");
    });

    return () => {
      socket.off("playerList");
      socket.off("joinDenied");
    };
  }, [room, playerName, socket, navigate]);

  const isHost = players[0] === playerName;

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h2>Room: {room}</h2>
      <h3>Players ({players.length}):</h3>
      <ul>
        {players.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {isHost ? (
        <button onClick={() => socket.emit("startGame")}>Start Game</button>
      ) : (
        <p>Waiting for host {players[0]} to start...</p>
      )}
    </div>
  );
};

export default Lobby;
