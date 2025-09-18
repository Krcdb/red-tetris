import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetGame, setGameConfig } from "../redux/gameSlice";
import type { RootState } from "../redux/store";
import { socketService } from "../services/socketService";
import GameBoard from "./GameBoard";
import GameControls from "./GameControls";
import GameInfo from "./GameInfo";
import GameOverModal from "./GameOverModal";

export default function Solo() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { status, score, linesCleared, error } = useSelector(
		(state: RootState) => state.game,
	);

	useEffect(() => {
		console.log("🎮 Solo: Setting up solo game with backend");

		// Generate a unique room name for solo play
		const soloRoom = `solo-${Date.now()}`;
		const playerName = "Player1";

		dispatch(resetGame());
		dispatch(
			setGameConfig({
				room: soloRoom,
				playerName,
				gameMode: "multiplayer", // Use multiplayer infrastructure but solo room
			}),
		);

		socketService.initialize();

		// Join a solo room
		socketService.joinRoom(playerName, soloRoom, "normal");

		// Listen for game setup
		socketService.socket.on("game:isSetup", () => {
			console.log("🎮 Solo: Game setup complete, sending ready");
			socketService.playerReady();
		});

		return () => {
			socketService.socket.off("game:isSetup");
			socketService.cleanup();
		};
	}, [dispatch]);

	const handleExit = () => {
		socketService.resetForHome();
		navigate("/");
	};

	// ✅ Check error state FIRST, before status
	if (error) {
		return (
			<div style={{ padding: "20px", color: "red" }}>
				<h2>Solo Game Error</h2>
				<p>{error}</p>
				<button type="button" onClick={handleExit}>
					Back to Home
				</button>
			</div>
		);
	}

	if (status === "idle") {
		return (
			<div style={{ padding: "20px", textAlign: "center" }}>
				<h2>Solo Tetris</h2>
				<p>Setting up game...</p>
				<div className="loading-spinner">⏳</div>
			</div>
		);
	}

	return (
		<div className="game-wrapper">
			<div className="game-container">
				<div className="left-panel">
					<GameControls />
				</div>
				<div className="center-panel">
					<h2 className="retro-title">Solo Tetris</h2>
					<GameBoard />
				</div>
				<div className="right-panel">
					<GameInfo />
				</div>
			</div>
			{status === "gameOver" && (
				<GameOverModal
					score={score}
					lines={linesCleared}
					isMultiplayer={false}
					onExit={handleExit}
				/>
			)}
		</div>
	);
}
