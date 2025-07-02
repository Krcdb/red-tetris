import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { setLobbyConfig, setLoading } from "../redux/lobbySlice";
import { setGameConfig } from "../redux/gameSlice";
import { socketService } from "../services/socketService";

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

    // Initialize socket service
    socketService.initialize();

    // Configure Redux state
    dispatch(setLobbyConfig({ room, playerName }));
    dispatch(setGameConfig({ room, playerName, gameMode: "multiplayer" }));
    dispatch(setLoading(false));

    // Join room via socket
    socketService.joinRoom(playerName, room);
    socketService.socket.on("game:isLaunching", () => {
      console.log("🚀 LobbyRoute: Game is launching, navigating to game route");
      // navigate(`/${room}/${playerName}/game`);
    });

    socketService.socket.on("game:isSetup", () => {
      console.log("🎮 LobbyRoute: Received game:isSetup, navigating to game");
      navigate(`/${room}/${playerName}/game`);
    });

    socketService.socket.on("game:isLaunching", () => {
      console.log("🚀 LobbyRoute: Game is launching, navigating to game route");
      // navigate(`/${room}/${playerName}/game`); // REMOVE this line
    });

    return () => {
      // Leave room when component unmounts
      // console.log("🏠 LobbyRoute: Cleanup - leaving room");
      // socketService.leaveRoom(playerName, room);
      socketService.socket.off("game:isSetup");
      socketService.socket.off("game:isLaunching");
      // socketService.socket.off("game:isSetup");
    };
  }, [room, playerName, dispatch, navigate]);

  // const startGame = () => {
  //   console.log("🚀 LobbyRoute: Attempting to start game:", { canStart, room });
  //   if (canStart && room) {
  //     socketService.startGame(room);
  //     navigate(`/${room}/${playerName}/game`);
  //   }
  // };

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
    <div style={{ padding: "20px" }}>
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

      {/* Debug info */}
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#f0f0f0",
          fontSize: "12px",
        }}
      >
        <strong>Debug Info:</strong>
        <br />
        Can Start: {canStart ? "Yes" : "No"}
        <br />
        Your Name: {playerName}
        <br />
        Players: {JSON.stringify(players, null, 2)}
      </div>

      <p style={{ fontSize: "12px", color: "blue" }}>
        Button disabled: {String(!canStart || players.length < 1 || isLoading)}
        (canStart: {String(canStart)}, players: {players.length}, isLoading:{" "}
        {String(isLoading)})
      </p>

      <button
        onClick={startGame}
        disabled={!canStart || players.length < 1 || isLoading}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          backgroundColor: canStart ? "green" : "gray",
          color: "white",
          border: "none",
          cursor: canStart ? "pointer" : "not-allowed",
        }}
      >
        {canStart
          ? `Start Game (${players.length} players ready)`
          : "Waiting for leader..."}
      </button>
    </div>
  );
}
