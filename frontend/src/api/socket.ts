import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket.IO connected with ID:', socketInstance?.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });
  }

  return socketInstance;
}
