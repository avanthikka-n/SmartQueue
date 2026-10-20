import { Server } from 'socket.io';

let io = null;

export const initSocket = (server, clientUrl) => {
  io = new Server(server, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join Organization Room
    socket.on('join_organization', (organizationId) => {
      if (organizationId) {
        const room = `organization:${organizationId}`;
        socket.join(room);
        console.log(`[Socket.IO] Socket ${socket.id} joined room: ${room}`);
      }
    });

    // Join Department Room
    socket.on('join_department', (departmentId) => {
      if (departmentId) {
        const room = `department:${departmentId}`;
        socket.join(room);
        console.log(`[Socket.IO] Socket ${socket.id} joined room: ${room}`);
      }
    });

    // Join Specific Token Tracking Room
    socket.on('join_token', (tokenId) => {
      if (tokenId) {
        const room = `token:${tokenId}`;
        socket.join(room);
        console.log(`[Socket.IO] Socket ${socket.id} joined room: ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized!');
  }
  return io;
};

// Emit real-time queue update helper
export const emitQueueUpdate = ({ organizationId, departmentId, eventName, payload }) => {
  if (!io) return;

  if (departmentId) {
    io.to(`department:${departmentId}`).emit(eventName, payload);
  }
  if (organizationId) {
    io.to(`organization:${organizationId}`).emit(eventName, payload);
  }
  const tId = payload?.tokenId || payload?.token?._id;
  if (tId) {
    io.to(`token:${tId}`).emit(eventName, payload);
  }
};
