import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Suppress console warnings in tests (they're expected from validation functions)
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = vi.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

// Mock the utils/socket module specifically
vi.mock("../utils/socket", () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    id: "test-socket-id",
    onAny: vi.fn(),
    offAny: vi.fn(),
  };

  return {
    default: mockSocket,
  };
});

// Also mock socket.io-client for any direct imports
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    onAny: vi.fn(),
    offAny: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    id: "test-socket-id",
  })),
}));

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: {
    getItem: vi.fn(() => "normal"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
