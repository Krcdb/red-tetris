import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import LobbyRoute from "./routes/LobbyRoute";
import GameRoute from "./routes/GameRoute";
import Solo from "./components/Solo";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/solo" element={<Solo />} />
          <Route path="/:room/:playerName" element={<LobbyRoute />} />
          <Route path="/:room/:playerName/game" element={<GameRoute />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
