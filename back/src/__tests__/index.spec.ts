import request from "supertest";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import MyWebSocket from "../core/socket/websocket";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../core/socket/websocket", () => {
  return {
    default: {
      getInstance: vi.fn(() => ({
        to: vi.fn(() => ({
          emit: vi.fn(),
        })),
      })),
    },
  };
});

describe("index.ts", () => {
  it("should start express app and respond to request", async () => {
    const app = express();
    app.use(cors());

    app.get("/ping", (_req, res) => {
      res.status(200).send("pong");
    });

    const httpServer = createServer(app);
    MyWebSocket.getInstance(httpServer);

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));

    const address = httpServer.address();
    const port = typeof address === "object" && address?.port;

    const res = await request(`http://localhost:${port}`).get("/ping");
    expect(res.status).toBe(200);
    expect(res.text).toBe("pong");

    httpServer.close();
  });
});
