import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LobbyState {
  players: Array<{ name: string; isLeader?: boolean; isReady?: boolean }>;
  room: string;
  playerName: string;
  canStart: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: LobbyState = {
  players: [],
  room: "",
  playerName: "",
  canStart: false,
  isLoading: false,
  error: null,
};

const lobbySlice = createSlice({
  name: "lobby",
  initialState,
  reducers: {
    setLobbyConfig: (
      state,
      action: PayloadAction<{ room: string; playerName: string }>
    ) => {
      state.room = action.payload.room;
      state.playerName = action.payload.playerName;
    },

    updatePlayers: (state, action: PayloadAction<any>) => {
      const match = action.payload;
      console.log("🔍 Redux: Received match data:", match);

      state.players = match.player || [];

      const currentPlayer = state.players.find(
        (p) => p.name === state.playerName
      );
      const isLeader = currentPlayer?.isLeader || false;

      console.log("🔍 Redux: Current player leadership status:", {
        playerName: state.playerName,
        currentPlayer,
        isLeader,
        allPlayers: state.players,
      }); // Debug log

      state.canStart = isLeader;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    resetLobby: () => initialState,
  },
});

export const {
  setLobbyConfig,
  updatePlayers,
  setError,
  setLoading,
  resetLobby,
} = lobbySlice.actions;
export default lobbySlice.reducer;
