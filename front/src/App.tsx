import {
  BrowserRouter as Router, // Keep BrowserRouter
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import Home from "./components/Home";
import Solo from "./components/Solo";
import LobbyRoute from "./routes/LobbyRoute"; // Keep your existing components
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
        {/* Main requirement: /<room>/<playerName> shows lobby */}
        <Route path="/:room/:playerName" element={<LobbyRoute />} />
        {/* Keep your game route as internal navigation */}
        <Route path="/:room/:playerName/game" element={<GameRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
