import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import Home from "./components/Home";
import Solo from "./components/Solo";
import LobbyRoute from "./routes/LobbyRoute";
import GameRoute from "./routes/GameRoute";
import socket from "./utils/socket";

export default function App() {
  useEffect(() => {
    // Connect socket once when app starts
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    // Cleanup on app unmount
    return () => {
      socket.disconnect();
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solo" element={<Solo />} />
        <Route path="/:room/:playerName" element={<LobbyRoute />} />
        <Route path="/:room/:playerName/game" element={<GameRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
