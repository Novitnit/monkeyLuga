import { sharedVersion } from '@isgame/shared';
import http from 'node:http';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok', sharedVersion }));
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
