import { Server } from 'socket.io';
import log from './log';
import { createServer } from 'http';
import dotenv from 'dotenv';
import verifyToken from './auth';

dotenv.config();

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const secret = process.env.SECRET || ""
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    credentials: true,
  }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (verifyToken(token,secret)) {
        next();
    } else {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
  socket.emit('ok', socket.id);
});

httpServer.listen(PORT, () => {
  log.info(`✅ server online`);
  console.log(`✅ server online`);
});
