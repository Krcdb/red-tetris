import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "./gameSlice";
import lobbyReducer from "./lobbySlice";

export const store = configureStore({
  reducer: {
    game: gameReducer,
    lobby: lobbyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
