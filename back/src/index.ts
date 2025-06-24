import cors from "cors";
import express from "express";
import { createServer } from "http";
import MyWebSocket from "./core/socket/websocket";

const app = express();
app.use(cors());
const port = process.env.PORT ?? "4000";

const httpServer = createServer(app);
const io = MyWebSocket.getInstance(httpServer);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
