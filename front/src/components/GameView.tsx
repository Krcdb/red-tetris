import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetGame } from "../redux/gameSlice";
import { resetLobby } from "../redux/lobbySlice";
import type { RootState } from "../redux/store";
import { socketService } from "../services/socketService";
import { validateGameMode, getGameModeDisplay } from "../utils/gameMode";

import GameBoard from "./GameBoard";
import GameControls from "./GameControls";
import GameInfo from "./GameInfo";
import GameOverModal from "./GameOverModal";
import "../routes/GameRoute.css";

export default function GameView() {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const { status, error, score, linesCleared, room, playerName } = useSelector(
		(state: RootState) => state.game,
	);

	const currentGameMode = validateGameMode(
		sessionStorage.getItem("selectedGameMode") || "normal",
	);

	useEffect(() => {
		const readyTimer = setTimeout(() => {
			socketService.playerReady();
		}, 200);

		return () => clearTimeout(readyTimer);
	}, []);

	const handleReturnToLobby = () => {
		// Just reset the game slice — GameRoom will render LobbyView again because
		// status becomes idle. Do NOT reload: a reload disconnects the socket and
		// the backend promotes someone else to leader (subject §V.2.1: only the
		// existing leader changes via disconnect, not via a return-to-lobby click).
		dispatch(resetGame());
	};

	const handleExitToHome = () => {
		dispatch(resetGame());
		dispatch(resetLobby());
		sessionStorage.clear();
		socketService.resetForHome();
		navigate("/", { replace: true });
	};

	if (error) {
		return (
			<div style={{ padding: "20px", color: "red" }}>
				<h2>Game Error</h2>
				<p>{error}</p>
				<button type="button" onClick={handleReturnToLobby}>Back to Lobby</button>
			</div>
		);
	}

	if (status === "idle") {
		return (
			<div style={{ padding: "20px", textAlign: "center" }}>
				<h2>Red Tetris - {room}</h2>
				<p>Player: {playerName}</p>
				<p>Waiting for game to start...</p>
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
					<h2 className="retro-title">Red Tetris - {room}</h2>
					<p>Player: {playerName}</p>
					<div className="game-mode-display">
						<p className="game-mode-text">
							Mode: {getGameModeDisplay(currentGameMode)}
						</p>
					</div>
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
					isMultiplayer={true}
					onReturnToLobby={handleReturnToLobby}
					onExit={handleExitToHome}
				/>
			)}
		</div>
	);
}
