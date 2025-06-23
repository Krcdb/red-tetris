import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Solo from "./components/Solo";
import LobbyRoute from "./routes/LobbyRoute";
import GameRoute from "./routes/GameRoute";
import socket from "./utils/socket";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const [_, room, playerName] = window.location.pathname.split("/");

    if (room && playerName) {
      const player = { name: playerName };

      socket.connect();
      socket.emit("match:playerJoin", { player, room });
    }

    socket.on("match:playerJoin", (newPlayer) => {
      console.log(`${newPlayer.name} joined`);
    });

    socket.on("match:playerLeft", (leftPlayer) => {
      console.log(`${leftPlayer.name} left`);
    });

    return () => {
      socket.disconnect();
      socket.off("match:playerJoin");
      socket.off("match:playerLeft");
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solo" element={<Solo />} />
        <Route path="/:room/:playerName" element={<LobbyRoute />} />
        <Route path="/:room/:playerName/game" element={<GameRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
