import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../redux/store";
import { socketService } from "../services/socketService";
import { getGameModeDisplay, validateGameMode } from "../utils/gameMode";
import "../routes/LobbyRoute.css";

export default function LobbyView() {
	const navigate = useNavigate();
	const { players, canStart, isLoading, error, room, playerName } = useSelector(
		(state: RootState) => state.lobby,
	);

	const currentGameMode = validateGameMode(
		sessionStorage.getItem("selectedGameMode") || "normal",
	);

	const startGame = () => {
		console.log("🚀 LobbyView: Starting game with mode:", currentGameMode);
		if (canStart && room) {
			socketService.startGame(room);
		}
	};

	if (error) {
		return (
			<div style={{ padding: "20px", color: "red" }}>
				<h2>Error</h2>
				<p>{error}</p>
				<button type="button" onClick={() => navigate("/")}>
					Go Home
				</button>
			</div>
		);
	}

	return (
		<div className="lobby-container">
			<div className="lobby-box">
				<h2>Lobby: {room}</h2>
				<p>You are: {playerName}</p>

				<div className="game-mode-indicator">
					<p
						style={{
							color: "#00fff7",
							fontSize: "0.8rem",
							margin: "0.5rem 0",
							padding: "0.5rem",
							background: "#111",
							border: "1px solid #00fff7",
							borderRadius: "0.25rem",
						}}
					>
						🎮 Mode: {getGameModeDisplay(currentGameMode)}
					</p>
				</div>

				<h3>Players in room ({players.length}):</h3>
				<ul>
					{players.map((p) => (
						<li key={p.name}>
							{p.name}
							{p.name === playerName && " (you)"}
							{p.isLeader && " (leader)"}
						</li>
					))}
				</ul>

				<button
					type="button"
					onClick={startGame}
					disabled={!canStart || isLoading}
					className="retro-button"
				>
					{canStart ? "Start Game" : "Waiting for leader..."}
				</button>

				<button
					type="button"
					onClick={() => navigate("/")}
					className="retro-button"
					style={{ marginTop: "1rem", backgroundColor: "#666" }}
				>
					🏠 Back to Home
				</button>
			</div>
		</div>
	);
}
