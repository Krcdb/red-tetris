import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { setLobbyConfig, setLoading } from "../redux/lobbySlice";
import { setGameConfig } from "../redux/gameSlice";
import { socketService } from "../services/socketService";
import "./LobbyRoute.css";

export default function LobbyRoute() {
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { players, canStart, isLoading, error } = useSelector(
    (state: RootState) => state.lobby
  );

  useEffect(() => {
    if (!room || !playerName) {
      navigate("/");
      return;
    }

    console.log("🏠 LobbyRoute: Initializing with:", { room, playerName });

    socketService.initialize();

    dispatch(setLobbyConfig({ room, playerName }));
    dispatch(setGameConfig({ room, playerName, gameMode: "multiplayer" }));
    dispatch(setLoading(false));

    socketService.joinRoom(playerName, room);
    socketService.socket.on("game:isLaunching", () => {
      console.log("🚀 LobbyRoute: Game is launching, navigating to game route");
    });

    socketService.socket.on("game:isSetup", () => {
      console.log("🎮 LobbyRoute: Received game:isSetup, navigating to game");
      navigate(`/${room}/${playerName}/game`);
    });

    socketService.socket.on("game:isLaunching", () => {
      console.log("🚀 LobbyRoute: Game is launching, navigating to game route");
    });

    return () => {
      socketService.socket.off("game:isSetup");
      socketService.socket.off("game:isLaunching");
    };
  }, [room, playerName, dispatch, navigate]);

  const startGame = () => {
    console.log("🚀 LobbyRoute: Start game button clicked!");
    console.log("🚀 LobbyRoute: Current state:", {
      canStart,
      room,
      playerName,
    });
    console.log("🚀 LobbyRoute: Players length:", players.length);
    console.log("🚀 LobbyRoute: Is loading:", isLoading);

    if (canStart && room) {
      console.log(
        "🚀 LobbyRoute: Conditions met, calling socketService.startGame"
      );
      socketService.startGame(room);
      console.log(
        "🚀 LobbyRoute: socketService.startGame called, navigating..."
      );
      navigate(`/${room}/${playerName}/game`);
    } else {
      console.log("🚀 LobbyRoute: Conditions NOT met:", {
        canStart,
        hasRoom: !!room,
      });
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

        {isLoading && <p>Joining room...</p>}

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
          onClick={startGame}
          disabled={!canStart || players.length < 1 || isLoading}
          className="retro-button"
          style={{
            opacity: !canStart ? 0.5 : 1,
          }}
        >
          {canStart
            ? `Start Game (${players.length} players ready)`
            : "Waiting for leader..."}
        </button>
      </div>
    </div>
  );
}
