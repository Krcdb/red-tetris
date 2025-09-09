import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "../../redux/gameSlice";
import lobbyReducer from "../../redux/lobbySlice";
import { useSocket } from "../useSocket";

const createTestStore = () => {
  return configureStore({
    reducer: {
      game: gameReducer,
      lobby: lobbyReducer,
    },
  });
};

describe("useSocket", () => {
  it("creates socket connection", () => {
    const store = createTestStore();
    const wrapper = ({ children }: { children?: React.ReactNode }) => <Provider store={store}>{children}</Provider>;

    const { result } = renderHook(() => useSocket(), { wrapper });
    expect(result.current).toBeDefined();
  });
});
