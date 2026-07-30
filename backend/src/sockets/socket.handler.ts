import { Server, Socket } from 'socket.io';
import { simulationEngine } from '../engine/simulation.engine';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected to live telemetry stream: ${socket.id}`);

    // Send initial snapshot of all states
    socket.emit('telemetry:init', {
      timestamp: new Date(),
      states: simulationEngine.getAllStates(),
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}
