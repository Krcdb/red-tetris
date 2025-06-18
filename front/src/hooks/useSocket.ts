import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { setGameState } from "../redux/gameSlice";

export function useSocket() {
  const dispatch = useDispatch();
  const socket: Socket = io("http://localhost:4000", {
    autoConnect: false,
  });

  useEffect(() => {
    const [, room, playerName] = window.location.pathname.split("/");
    socket.auth = { room, playerName };
    socket.connect();

    socket.emit("joinRoom", { room, playerName });

    socket.on("gameState", (payload) => {
      dispatch(setGameState(payload));
    });

    socket.on("roomFull", () => {
      alert("Room is full. Redirecting you home.");
      window.location.replace("/");
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  return socket;
}
