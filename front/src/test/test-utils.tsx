import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "../redux/gameSlice";
import lobbyReducer from "../redux/lobbySlice";

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      game: gameReducer,
      lobby: lobbyReducer,
    },
    preloadedState,
  });
};

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<ReturnType<typeof createTestStore>["getState"]>;
  store?: ReturnType<typeof createTestStore>;
}

const customRender = (
  ui: ReactElement,
  { preloadedState = {}, store = createTestStore(preloadedState), ...renderOptions }: CustomRenderOptions = {}
) => {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// Explicitly export only the required components from @testing-library/react
export { render as baseRender, screen, fireEvent, waitFor, act } from "@testing-library/react";
export { customRender as render };
