import { Server as SocketIOServer, ServerOptions, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { registerMatchHanlder } from './events/match.events';

const WEBSOCKET_CORS = {
    origin: "*",
    methods: ["GET", "POST"]
}

class MyWebSocket extends SocketIOServer {
  private static io: MyWebSocket;

  constructor(httpServer: HTTPServer) {
    super(httpServer, {
      cors: WEBSOCKET_CORS
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.on('connection', (socket: Socket) => {
      console.log(`🟢 Client connected: ${socket.id}`)

      registerMatchHanlder(this, socket);

      socket.on('message', (data) => {
        console.log(`📩 Message from ${socket.id}:`, data)
        this.emit('message', data);
      })

      socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
      })
    })
  }

  public static getInstance(httpServer?: HTTPServer): MyWebSocket {
    if (!MyWebSocket.io) {
      if (!httpServer) {
        throw new Error('No Http Server provided');
      }
      else {
        MyWebSocket.io = new MyWebSocket(httpServer);
      }
    }

    return MyWebSocket.io;
  }
}


export default MyWebSocket