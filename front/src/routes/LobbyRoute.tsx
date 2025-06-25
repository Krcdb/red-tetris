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

    // Don't connect/disconnect - socket is managed by App.tsx
    socket.emit("match:playerJoin", { playerName, room });

    // Add yourself to the players list immediately
    setPlayers([{ name: playerName }]);

    socket.on("match:playerHasJoin", (joinedPlayerName: string) => {
      console.log("Player joined:", joinedPlayerName);
      setPlayers((ps) =>
        ps.find((x) => x.name === joinedPlayerName)
          ? ps
          : [...ps, { name: joinedPlayerName }]
      );
    });

    socket.on("match:playerHasLeft", (leftPlayerName: string) => {
      console.log("Player left:", leftPlayerName);
      setPlayers((ps) => ps.filter((x) => x.name !== leftPlayerName));
    });

    socket.on("match:nameTaken", (takenName: string) => {
      alert(`Name "${takenName}" is already taken!`);
      navigate("/");
    });

    return () => {
      socket.emit("match:playerLeft", { playerName, room });
      socket.off("match:playerHasJoin");
      socket.off("match:playerHasLeft");
      socket.off("match:nameTaken");
      // Don't disconnect socket here
    };
  }, [room, playerName, navigate]);

  const startGame = () => {
    socket.emit("match:startGame", { room });
    navigate(`/${room}/${playerName}/game`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Lobby: {room}</h2>
      <p>You are: {playerName}</p>
      <h3>Players in room ({players.length}):</h3>
      <ul>
        {players.map((p) => (
          <li key={p.name}>
            {p.name} {p.name === playerName && "(you)"}
          </li>
        ))}
      </ul>
      <button onClick={startGame} disabled={players.length < 1}>
        Start Game ({players.length} players ready)
      </button>
    </div>
  );
}
