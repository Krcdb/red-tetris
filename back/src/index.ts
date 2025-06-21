import express from "express";
import cors from "cors";
import { createServer } from "http";
import MyWebSocket from "./socket/websocket";
import { middleware } from "./middlewares/middlewares";

const app = express();
app.use(cors());
const port = process.env.PORT ?? "4000";

const httpServer = createServer(app);
const io = MyWebSocket.getInstance(httpServer);

app.get("/", middleware);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});