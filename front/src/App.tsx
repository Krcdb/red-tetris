import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GameRoom from "./components/GameRoom";
import Home from "./components/Home";

function App() {
	return (
		<Router>
			<div className="App">
				<Routes>
					<Route path="/" element={<Home />} />
					{/* URL shape per subject.md §V.2.1: /<room>/<player_name> */}
					<Route path="/:room/:playerName" element={<GameRoom />} />
				</Routes>
			</div>
		</Router>
	);
}

export default App;
