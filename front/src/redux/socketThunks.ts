import { createAsyncThunk } from "@reduxjs/toolkit";
import socket from "../utils/socket";
import { GamerInputs } from "./gameSlice";

export const sendPlayerInput = createAsyncThunk(
  "game/sendPlayerInput",
  async (input: GamerInputs) => {
    socket.emit("game:playerInputChanges", { input });
    return input;
  }
);

export const joinMatch = createAsyncThunk(
  "game/joinMatch",
  async ({ playerName, room }: { playerName: string; room: string }) => {
    socket.emit("match:playerJoin", { playerName, room });
    return { playerName, room };
  }
);

export const startGame = createAsyncThunk(
  "game/startGame",
  async (room: string) => {
    socket.emit("match:startGame", { room });
    return room;
  }
);

export const leaveMatch = createAsyncThunk(
  "game/leaveMatch",
  async (room: string) => {
    socket.emit("match:playerLeave", { room });
    return room;
  }
);
