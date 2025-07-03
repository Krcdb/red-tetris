import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { store } from "./redux/store";
import { socketService } from "./services/socketService";
import Home from "./components/Home";
import LobbyRoute from "./routes/LobbyRoute";
import GameRoute from "./routes/GameRoute";
import Solo from "./components/Solo";

socketService.initialize();

function App() {
  return (
    <Provider store={store}>
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
    </Provider>
  );
}

export default App;
