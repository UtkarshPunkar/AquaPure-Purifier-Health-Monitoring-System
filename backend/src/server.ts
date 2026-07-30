import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { ENV } from './config/env';
import { simulationEngine } from './engine/simulation.engine';
import { setupSocketHandlers } from './sockets/socket.handler';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io);
simulationEngine.setSocketServer(io);

server.listen(ENV.PORT, async () => {
  console.log(`🚀 Smart Water Backend Server running on http://localhost:${ENV.PORT}`);
  await simulationEngine.initialize();
});
