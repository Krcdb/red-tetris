import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../utils/socket";

interface Player {
  name: string;
}

export default function LobbyRoute() {
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!room || !playerName) return;

    socket.connect();
    socket.emit("match:playerJoin", { player: { name: playerName }, room });

    socket.on("match:playerHasJoin", (p: Player) =>
      setPlayers((ps) => (ps.find((x) => x.name === p.name) ? ps : [...ps, p]))
    );
    socket.on("match:playerHasLeft", (p: Player) =>
      setPlayers((ps) => ps.filter((x) => x.name !== p.name))
    );

    return () => {
      socket.emit("match:playerLeft", { player: { name: playerName }, room });
      socket.disconnect();
    };
  }, [room, playerName]);

  const startGame = () => {
    navigate(`/${room}/${playerName}/game`);
  };

  return (
    <div>
      <h2>Lobby: {room}</h2>
      <ul>
        {players.map((p) => (
          <li key={p.name}>{p.name}</li>
        ))}
      </ul>
      <button onClick={startGame} disabled={players.length < 1}>
        Start Game
      </button>
    </div>
  );
}
