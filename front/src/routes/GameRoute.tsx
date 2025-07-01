import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "../hooks/useGame";
import { useDispatch } from "react-redux";
import { setPieces, updateBoard, updatePlayerState } from "../redux/gameSlice";
import socket from "../utils/socket";
import Board from "../components/Board";
import { NextPiecePreview } from "../components/NextPiecePreview";
import { useNavigate } from "react-router-dom";
import Spectre from "../components/Spectre";
import { calculateSpectre } from "../utils/calculateSpectre";

interface PieceHistoryEntry {
  index: number;
  type: string;
  timestamp: string;
  playerName: string;
}

interface PieceAtIndex {
  index: number;
  piecesByPlayer: { [playerName: string]: string };
  isSynced: boolean;
}

export default function GameRoute() {
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();

  const { status, currentPiece, board, start, nextPieces } = useGame();
  const dispatch = useDispatch();

  const [pieceHistory, setPieceHistory] = useState<PieceHistoryEntry[]>([]);
  const [allPlayersData, setAllPlayersData] = useState<any[]>([]);
  const [pieceSyncTable, setPieceSyncTable] = useState<PieceAtIndex[]>([]);
  const [gameState, setGameState] = useState<any>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasJoined && socket.connected && gameState?.isRunning) {
        console.log("📤 Emitting match:playerLeft before unload", {
          playerName,
          room,
        });
        socket.emit("match:playerLeft", { playerName, room });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasJoined, gameState, playerName, room]);

  useEffect(() => {
    if (!room || !playerName) return;

    console.log("🎮 GameRoute: Setting up game events", {
      room,
      playerName,
      socketConnected: socket.connected,
    });

    if (!hasJoined) {
      console.log("📤 Emitting match:playerJoin", { playerName, room });
      socket.emit("match:playerJoin", { playerName, room });
      setHasJoined(true);
    }

    socket.on("game:isSetup", () => {
      console.log("🔧 Game is being set up - sending player ready");
      socket.emit("game:playerReady");
    });

    socket.on("game:isLaunching", () => {
      console.log("🚀 Game is launching!");
      start("multiplayer");
    });

    socket.on("game:newState", (gameState) => {
      setGameState(gameState);

      const pieceIndices =
        gameState.gamers?.map((g: any) => g.currentPieceIndex) || [];
      const minIndex = Math.min(...pieceIndices);
      const maxIndex = Math.max(...pieceIndices);
      console.log(`🎯 Piece Index Range: ${minIndex} to ${maxIndex}`);

      setAllPlayersData(gameState.gamers || []);

      if (gameState.gamers) {
        const newEntries: PieceHistoryEntry[] = [];
        gameState.gamers.forEach((gamer: any) => {
          if (gamer.currentPiece && gamer.currentPieceIndex >= 0) {
            newEntries.push({
              index: gamer.currentPieceIndex,
              type: gamer.currentPiece.type,
              timestamp: new Date().toLocaleTimeString(),
              playerName: gamer.name,
            });
          }
        });

        setPieceHistory((prev) => {
          const updated = [...prev];
          newEntries.forEach((entry) => {
            const exists = updated.find(
              (h) =>
                h.index === entry.index && h.playerName === entry.playerName
            );
            if (!exists) updated.push(entry);
          });
          return updated.slice(-50);
        });

        const syncTable: { [index: number]: PieceAtIndex } = {};
        pieceHistory.forEach((entry) => {
          if (!syncTable[entry.index]) {
            syncTable[entry.index] = {
              index: entry.index,
              piecesByPlayer: {},
              isSynced: false,
            };
          }
          syncTable[entry.index].piecesByPlayer[entry.playerName] = entry.type;
        });

        gameState.gamers.forEach((gamer: any) => {
          if (gamer.currentPiece && gamer.currentPieceIndex >= 0) {
            if (!syncTable[gamer.currentPieceIndex]) {
              syncTable[gamer.currentPieceIndex] = {
                index: gamer.currentPieceIndex,
                piecesByPlayer: {},
                isSynced: false,
              };
            }
            syncTable[gamer.currentPieceIndex].piecesByPlayer[gamer.name] =
              gamer.currentPiece.type;
          }
        });

        Object.values(syncTable).forEach((entry) => {
          const pieceTypes = Object.values(entry.piecesByPlayer);
          entry.isSynced =
            pieceTypes.length > 1 &&
            pieceTypes.every((type) => type === pieceTypes[0]);
        });

        setPieceSyncTable(
          Object.values(syncTable).sort((a, b) => a.index - b.index)
        );
      }

      const currentPlayerData = gameState.gamers?.find(
        (g: any) => g.name === playerName
      );

      if (currentPlayerData) {
        dispatch(
          setPieces({
            currentPiece: currentPlayerData.currentPiece,
            nextPieces: currentPlayerData.nextPieces || [],
          })
        );

        dispatch(
          updatePlayerState({
            score: currentPlayerData.score,
            linesCleared: currentPlayerData.linesCleared,
          })
        );

        if (currentPlayerData.grid) {
          dispatch(updateBoard(currentPlayerData.grid));
        }
      }
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    return () => {
      console.log("🧹 Cleaning up GameRoute socket events");

      // ❗️Do NOT emit match:playerLeft here — use beforeunload instead!

      socket.off("game:isSetup");
      socket.off("game:isLaunching");
      socket.off("game:newState");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, [room, playerName, dispatch, start, pieceHistory, hasJoined, gameState]);

  return (
    <div style={{ padding: "20px" }}>
      {/* Game Over Overlay */}
      {gameState && !gameState.isRunning && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#2a2a2a",
              borderRadius: "12px",
              padding: "2rem",
              textAlign: "center",
              border: "2px solid #ff6b6b",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              color: "white",
            }}
          >
            <h1
              style={{
                color: "#ff6b6b",
                marginBottom: "1.5rem",
                fontSize: "2.5rem",
                textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
              }}
            >
              🎮 GAME OVER
            </h1>
            <div style={{ margin: "1.5rem 0" }}>
              {gameState.gamers
                ?.sort((a: any, b: any) => b.score - a.score)
                .map((gamer: any, index: number) => (
                  <div
                    key={gamer.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 1rem",
                      margin: "0.5rem 0",
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "6px",
                      minWidth: "300px",
                    }}
                  >
                    <span style={{ fontWeight: "bold", color: "#ffd93d" }}>
                      #{index + 1}
                    </span>
                    <span
                      style={{ flex: 1, textAlign: "left", marginLeft: "1rem" }}
                    >
                      {gamer.name}
                    </span>
                    <span style={{ color: "#4ecdc4", fontWeight: "bold" }}>
                      {gamer.score} pts
                    </span>
                    <span style={{ color: "#95e1d3", fontSize: "0.9rem" }}>
                      {gamer.linesCleared} lines
                    </span>
                  </div>
                ))}
            </div>
            <button
              style={{
                background: "#4ecdc4",
                color: "white",
                border: "none",
                padding: "0.75rem 2rem",
                borderRadius: "6px",
                fontSize: "1.1rem",
                cursor: "pointer",
                marginTop: "1rem",
                transition: "background 0.3s",
              }}
              onClick={() => navigate("/")}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#45b7aa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#4ecdc4")
              }
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <h1>Game: {room}</h1>
      <p>Player: {playerName}</p>
      <p>Status: {status}</p>
      <p>Socket Connected: {socket.connected ? "Yes" : "No"}</p>

      {status === "idle" && (
        <div>
          <p>Waiting for game to start...</p>
          <button
            onClick={() => {
              console.log("🔘 Manual start game button clicked");
              socket.emit("match:startGame", { room });
            }}
          >
            🚀 Start Game Manually
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        <div>
          <Board />
        </div>
        <div>
          <h3>Next Piece:</h3>
          <NextPiecePreview nextPiece={nextPieces[0]} />
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
            <h4>Debug Info:</h4>
            <p>Current Piece: {currentPiece?.type || "None"}</p>
          </div>
        </div>

        <div>
          <h3>Opponents</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {allPlayersData
              ?.filter((player) => player.name !== playerName)
              ?.map((opponent) => (
                <Spectre
                  key={opponent.name}
                  playerName={opponent.name}
                  spectreData={calculateSpectre(opponent.grid || [])}
                />
              ))}
          </div>
          {allPlayersData?.filter((p) => p.name !== playerName).length ===
            0 && (
            <p style={{ fontSize: "12px", color: "#666" }}>No opponents yet</p>
          )}
        </div>

        <div>
          <h3>Controls:</h3>
          <p>Arrow Keys or WASD to move</p>
          <p>Space to hard drop</p>
        </div>
      </div>

      <div style={{ marginTop: "30px", display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <h3>🎯 Current Player Status</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              border: "1px solid #ccc",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Player
                </th>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Piece #
                </th>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Type
                </th>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Score
                </th>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Lines
                </th>
              </tr>
            </thead>
            <tbody>
              {allPlayersData.map((player: any, index: number) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor:
                      player.name === playerName ? "#e8f5e8" : "white",
                  }}
                >
                  <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                    {player.name} {player.name === playerName && "👤"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                    #{player.currentPieceIndex}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: getPieceColor(player.currentPiece?.type),
                      }}
                    >
                      {player.currentPiece?.type || "-"}
                    </span>
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                    {player.score}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                    {player.linesCleared}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }}>
          <h3>🔄 Piece Synchronization Check</h3>
          <div
            style={{
              maxHeight: "500px",
              overflowY: "auto",
              border: "1px solid #ccc",
              fontSize: "11px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f0f0f0",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <th style={{ border: "1px solid #ccc", padding: "4px" }}>
                    Piece #
                  </th>
                  {[...new Set(allPlayersData.map((p) => p.name))].map(
                    (playerName) => (
                      <th
                        key={playerName}
                        style={{ border: "1px solid #ccc", padding: "4px" }}
                      >
                        {playerName}
                      </th>
                    )
                  )}
                  <th style={{ border: "1px solid #ccc", padding: "4px" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pieceSyncTable.map((entry, index) => {
                  const playerNames = [
                    ...new Set(allPlayersData.map((p) => p.name)),
                  ];
                  const hasAllPlayers = playerNames.every(
                    (name) => entry.piecesByPlayer[name]
                  );
                  const allSame = hasAllPlayers && entry.isSynced;

                  return (
                    <tr
                      key={`piece-${entry.index}`}
                      style={{
                        backgroundColor: allSame
                          ? "#e8f5e8"
                          : hasAllPlayers
                          ? "#ffe8e8"
                          : "#fff8e1",
                      }}
                    >
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "3px",
                          fontWeight: "bold",
                        }}
                      >
                        #{entry.index}
                      </td>
                      {playerNames.map((name) => (
                        <td
                          key={name}
                          style={{ border: "1px solid #ccc", padding: "3px" }}
                        >
                          <span
                            style={{
                              fontWeight: "bold",
                              color: getPieceColor(entry.piecesByPlayer[name]),
                            }}
                          >
                            {entry.piecesByPlayer[name] || "-"}
                          </span>
                        </td>
                      ))}
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "3px",
                          fontSize: "10px",
                        }}
                      >
                        {allSame
                          ? "✅ SYNC"
                          : hasAllPlayers
                          ? "❌ DIFF"
                          : "⏳ WAIT"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: "10px", marginTop: "5px", color: "#666" }}>
            <p>✅ Green = All players have same piece at this index</p>
            <p>❌ Red = All players have piece but different types</p>
            <p>⏳ Yellow = Some players missing this piece index</p>
            <p>
              <strong>Total pieces tracked: {pieceSyncTable.length}</strong>
            </p>
            <p>
              <strong>
                Synced pieces:{" "}
                {
                  pieceSyncTable.filter((p) => {
                    const playerNames = [
                      ...new Set(allPlayersData.map((p) => p.name)),
                    ];
                    const hasAllPlayers = playerNames.every(
                      (name) => p.piecesByPlayer[name]
                    );
                    return hasAllPlayers && p.isSynced;
                  }).length
                }
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get piece colors
function getPieceColor(pieceType: string): string {
  const colors: { [key: string]: string } = {
    I: "#00f0f0", // Cyan
    O: "#f0f000", // Yellow
    T: "#a000f0", // Purple
    S: "#00f000", // Green
    Z: "#f00000", // Red
    J: "#0000f0", // Blue
    L: "#f0a000", // Orange
  };
  return colors[pieceType] || "#000000";
}
