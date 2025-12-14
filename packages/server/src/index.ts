import express from 'express';
import http from 'node:http';
import { monitor } from '@colyseus/monitor';
import { playground } from '@colyseus/playground';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use('/', playground())
app.use('/colyseus', monitor());

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server })
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`Monitor available at http://localhost:${port}/colyseus`);
});
