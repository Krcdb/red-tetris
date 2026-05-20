import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import socket from "../utils/socket";

// Legacy hook: pre-dates the canonical socket-events contract and is only
// referenced by the (also-legacy) Lobby component. Routed through `unknown` so
// the event names (`joinRoom`, `roomFull`) — which are not in the typed
// contract — still compile.
const legacy = socket as unknown as Socket;

export function useSocket() {
  useEffect(() => {
    const [, room, playerName] = window.location.pathname.split("/");
    legacy.auth = { room, playerName };
    if (!legacy.connected) legacy.connect();

    legacy.emit("joinRoom", { room, playerName });

    const onRoomFull = () => {
      alert("Room is full. Redirecting you home.");
      window.location.replace("/");
    };
    legacy.on("roomFull", onRoomFull);

    return () => {
      legacy.off("roomFull", onRoomFull);
    };
  }, []);

  return legacy;
}
