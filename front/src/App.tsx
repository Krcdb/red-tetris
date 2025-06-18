import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Solo from "./components/Solo";
import LobbyRoute from "./routes/LobbyRoute";
import GameRoute from "./routes/GameRoute";

export default function App() {
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
