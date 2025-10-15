import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const setSocketIO = (socketInstance: SocketIOServer): void => {
  io = socketInstance;
};

export const getSocketIO = (): SocketIOServer | null => {
  return io;
};
