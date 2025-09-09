import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { setLobbyConfig, setLoading } from "../redux/lobbySlice";
import { setGameConfig } from "../redux/gameSlice";
import { socketService } from "../services/socketService";
import "./LobbyRoute.css";
import { resetGame } from "../redux/gameSlice";
import { getGameModeDisplay, validateGameMode } from "../utils/gameMode";

export default function LobbyRoute() {
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();
  const [searchParams] = useSearchParams();
  const rawGameMode = searchParams.get("mode") || "normal";

  // Fix: Validate the game mode to ensure it's a proper GameMode type
  const gameMode = validateGameMode(rawGameMode);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { players, canStart, isLoading, error } = useSelector((state: RootState) => state.lobby);

  useEffect(() => {
    if (!room || !playerName) {
      navigate("/");
      return;
    }

    console.log("🏠 LobbyRoute: Initializing with:", { room, playerName });

    dispatch(resetGame());
    socketService.initialize();

    dispatch(setLobbyConfig({ room, playerName }));
    dispatch(setGameConfig({ room, playerName, gameMode: "multiplayer" }));
    dispatch(setLoading(false));

    sessionStorage.setItem("selectedGameMode", gameMode);

    socketService.joinRoom(playerName, room, gameMode);

    socketService.socket.on("game:isSetup", () => {
      console.log("🎮 LobbyRoute: Received game:isSetup, navigating to game");
      navigate(`/${room}/${playerName}/game`);
    });

    return () => {
      socketService.socket.off("game:isSetup");
      // socketService.socket.off("game:isLaunching");
    };
  }, [room, playerName, gameMode, dispatch, navigate]);

  const startGame = () => {
    console.log("🚀 LobbyRoute: Starting game with mode:", gameMode);
    if (canStart && room) {
      socketService.startGame(room);
    }
  };

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-box">
        <h2>Lobby: {room}</h2>
        <p>You are: {playerName}</p>

        {/* ✅ Simple game mode display */}
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
            {/* Fix: Now gameMode is properly typed as GameMode */}
            🎮 Mode: {getGameModeDisplay(gameMode)}
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

        <button onClick={startGame} disabled={!canStart || isLoading} className="retro-button">
          {canStart ? "Start Game" : "Waiting for leader..."}
        </button>

        <button
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
