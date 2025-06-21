import cors from "cors";
import express from "express";
import { createServer } from "http";

import { middleware } from "./middlewares/middlewares";
import MyWebSocket from "./socket/websocket";

const app = express();
app.use(cors());
const port = process.env.PORT ?? "4000";

const httpServer = createServer(app);
const io = MyWebSocket.getInstance(httpServer);

app.get("/", middleware);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
