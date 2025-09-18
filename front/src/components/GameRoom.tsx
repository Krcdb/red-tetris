import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import GameView from "../components/GameView";
import LobbyView from "../components/LobbyView";
import { gameSetup, resetGame, setGameConfig } from "../redux/gameSlice";
import { resetLobby, setLoading, setLobbyConfig } from "../redux/lobbySlice";
import type { RootState } from "../redux/store";
import { socketService } from "../services/socketService";
import { validateGameMode } from "../utils/gameMode";

export default function GameRoom() {
	const { room, playerName } = useParams<{
		room: string;
		playerName: string;
	}>();
	const [searchParams] = useSearchParams();
	const rawGameMode = searchParams.get("mode") || "normal";
	const gameMode = validateGameMode(rawGameMode);

	const navigate = useNavigate();
	const dispatch = useDispatch();

	// Get state from both slices - we need both!
	const lobbyState = useSelector((state: RootState) => state.lobby);
	const gameState = useSelector((state: RootState) => state.game);

	useEffect(() => {
		if (!room || !playerName) {
			navigate("/");
			return;
		}

		console.log("🏠 GameRoom: Initializing with:", {
			room,
			playerName,
			gameMode,
		});

		dispatch(resetGame());
		dispatch(resetLobby());
		socketService.initialize();

		dispatch(setLobbyConfig({ room, playerName }));
		dispatch(setGameConfig({ room, playerName, gameMode: "multiplayer" }));
		dispatch(setLoading(false));

		sessionStorage.setItem("selectedGameMode", gameMode);

		socketService.joinRoom(playerName, room, gameMode);

		// Handle game setup (transition from lobby to game)
		socketService.socket.on("game:isSetup", () => {
			console.log("🎮 GameRoom: Game setup complete, updating game state");
			// Update the game state to indicate setup is complete
			dispatch(gameSetup());
		});

		socketService.socket.on("match:error", () => {
			console.log("❌ GameRoom: Error joining lobby");
			navigate("/");
		});

		return () => {
			socketService.socket.off("game:isSetup");
			socketService.socket.off("match:error");
		};
	}, [room, playerName, gameMode, dispatch, navigate]);

	// Determine which view to show based on game status
	// Show game view when game is setup, playing, or game over
	const isInGame =
		gameState.status === "setup" ||
		gameState.status === "playing" ||
		gameState.status === "gameOver";

	console.log("🔍 GameRoom: Current states:", {
		gameStatus: gameState.status,
		lobbyError: lobbyState.error,
		isInGame,
		playersCount: lobbyState.players.length,
	});

	if (isInGame) {
		return <GameView />;
	} else {
		return <LobbyView />;
	}
}
