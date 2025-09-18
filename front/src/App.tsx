import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import GameRoom from "./components/GameRoom";
import Home from "./components/Home";

function App() {
	return (
		<Router>
			<div className="App">
				<Routes>
					<Route path="/" element={<Home />} />
					{/* <Route path="/solo" element={<Solo />} /> */}
					{/* Single route that handles both lobby and game states */}
					<Route path="/:room/:playerName" element={<GameRoom />} />
				</Routes>
			</div>
		</Router>
	);
}

export default App;
