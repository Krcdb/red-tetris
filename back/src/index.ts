import cors from "cors";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import MyWebSocket from "./core/socket/websocket.js";

const app = express();
app.use(cors());
const port = process.env.PORT ?? "4000";

// Subject §V.2.2: server must serve index.html, bundle.js, and static assets via HTTP.
const here = path.dirname(fileURLToPath(import.meta.url));
const FRONT_DIST = process.env.FRONT_DIST ?? path.resolve(here, "../../front/dist");

app.use(express.static(FRONT_DIST));

// SPA fallback: BrowserRouter paths like /:room/:playerName must return index.html.
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  res.sendFile(path.join(FRONT_DIST, "index.html"));
});

const httpServer = createServer((req, res) => { app(req, res); });
MyWebSocket.getInstance(httpServer);

httpServer.listen(port);
