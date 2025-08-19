import { Server } from 'socket.io';
import log from './log';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { verifyToken, readToken } from './auth';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from './types/scoket';

dotenv.config();

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const secret = process.env.SECRET || ""
const httpServer = createServer();

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
  >(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    }
  });

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (verifyToken(token, secret)) {
    const user = readToken(token, secret);
    if (user) {
      socket.data.user = {
        uuid: user.id,
        name: user.name,
        role: user.role
      }
      log.info(`User ${user.name} connected with role ${user.role}`);
    }
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`${socket.data.user.name} connected`);
});

httpServer.listen(PORT, () => {
  log.info(`✅ server online`);
  console.log(`✅ server online`);
});
